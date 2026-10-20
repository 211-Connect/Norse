import { sql } from '@payloadcms/db-postgres';
import { after } from 'next/server';
import type { Payload } from 'payload';

import { createLogger } from '@/lib/logger';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';

import { TranslationMeter, createTranslationMeter } from './translation-meter';
import { sendTranslationUsageAlertEmail } from './translation-usage-alert-email';
import {
  TranslationUsageLimits,
  charactersToUsd,
  getUsageMonth,
  resolveTranslationUsageLimits,
  usdToCharacters,
} from './translation-usage-limits';

/**
 * Server-only metering and limits for printable directory auto-translation.
 * See docs/translation-usage.md.
 */

const log = createLogger('translationUsage');

export type TranslationUsageContext = {
  tenantId: string;
  tenantName: string;
  userEmail: string;
};

export type TranslationAllowance =
  { allowed: true } | { allowed: false; reason: 'user_quota' | 'tenant_cap' };

type DrizzleExecutor = {
  execute: (query: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }>;
};

function getDb(payload: Payload): DrizzleExecutor {
  return (payload.db as unknown as { drizzle: DrizzleExecutor }).drizzle;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function getTenantLimits(
  payload: Payload,
  tenantId: string,
): Promise<TranslationUsageLimits> {
  const { docs } = await payload.find({
    collection: 'resource-directories',
    where: { tenant: { equals: tenantId } },
    limit: 1,
    depth: 0,
    select: { printableDirectories: true },
  });

  return resolveTranslationUsageLimits(
    docs[0]?.printableDirectories?.translation,
  );
}

async function getMonthTotals(
  payload: Payload,
  tenantId: string,
  userEmail: string,
  month: string,
): Promise<{ tenant: number; user: number }> {
  const { rows } = await getDb(payload).execute(sql`
    SELECT
      coalesce(sum(billed_characters), 0)::bigint AS tenant,
      coalesce(
        sum(billed_characters) FILTER (
          WHERE
            user_email = ${userEmail}
        ),
        0
      )::bigint AS "user"
    FROM
      translation_usage
    WHERE
      tenant_id = ${tenantId}
      AND MONTH = ${month}
  `);
  const row = rows[0] as { tenant: string | number; user: string | number };

  return { tenant: Number(row?.tenant ?? 0), user: Number(row?.user ?? 0) };
}

/**
 * Whether `userEmail` may still machine-translate this month. Checked before
 * translating, so a single save can overshoot a limit by its own size (kept
 * small by the API's field length limits).
 */
export async function getTranslationAllowance(
  tenantId: string,
  userEmail: string,
): Promise<TranslationAllowance> {
  const payload = await getPayloadSingleton();
  const [limits, totals] = await Promise.all([
    getTenantLimits(payload, tenantId),
    getMonthTotals(
      payload,
      tenantId,
      normalizeEmail(userEmail),
      getUsageMonth(),
    ),
  ]);
  const toCharacters = (usd: number) =>
    usdToCharacters(usd, limits.pricePerMillionCharacters);

  if (totals.tenant >= toCharacters(limits.tenantCapUsd)) {
    return { allowed: false, reason: 'tenant_cap' };
  }
  if (totals.user >= toCharacters(limits.userQuotaUsd)) {
    return { allowed: false, reason: 'user_quota' };
  }

  return { allowed: true };
}

async function recordUsage(
  payload: Payload,
  context: TranslationUsageContext,
  meter: TranslationMeter,
): Promise<void> {
  const month = getUsageMonth();
  const userEmail = normalizeEmail(context.userEmail);
  const locales = JSON.stringify(meter.locales);

  await getDb(payload).execute(sql`
    INSERT INTO
      translation_usage (
        tenant_id,
        MONTH,
        user_email,
        billed_characters,
        requested_characters,
        translation_runs,
        largest_field_characters,
        locales,
        last_used_at,
        updated_at,
        created_at
      )
    VALUES
      (
        ${context.tenantId},
        ${month},
        ${userEmail},
        ${meter.billedCharacters},
        ${meter.requestedCharacters},
        1,
        ${meter.largestFieldCharacters},
        ${locales}::jsonb,
        now(),
        now(),
        now()
      )
    ON CONFLICT (tenant_id, MONTH, user_email) DO UPDATE
    SET
      billed_characters = translation_usage.billed_characters + EXCLUDED.billed_characters,
      requested_characters = translation_usage.requested_characters + EXCLUDED.requested_characters,
      translation_runs = translation_usage.translation_runs + 1,
      largest_field_characters = GREATEST(
        translation_usage.largest_field_characters,
        EXCLUDED.largest_field_characters
      ),
      locales = (
        SELECT
          coalesce(
            jsonb_agg(
              DISTINCT locale
              ORDER BY
                locale
            ),
            '[]'::jsonb
          )
        FROM
          jsonb_array_elements_text(
            coalesce(translation_usage.locales, '[]'::jsonb) || EXCLUDED.locales
          ) AS locale
      ),
      last_used_at = now(),
      updated_at = now()
  `);

  if (meter.billedCharacters === 0) {
    return;
  }

  const [limits, totals] = await Promise.all([
    getTenantLimits(payload, context.tenantId),
    getMonthTotals(payload, context.tenantId, userEmail, month),
  ]);
  const thresholdCharacters = usdToCharacters(
    limits.alertThresholdUsd,
    limits.pricePerMillionCharacters,
  );

  if (totals.tenant < thresholdCharacters) {
    return;
  }

  // The unique (tenant_id, month) index lets exactly one request win.
  const { rows } = await getDb(payload).execute(sql`
    INSERT INTO
      translation_usage_alerts (
        tenant_id,
        MONTH,
        billed_characters,
        threshold_usd,
        updated_at,
        created_at
      )
    VALUES
      (
        ${context.tenantId},
        ${month},
        ${totals.tenant},
        ${limits.alertThresholdUsd},
        now(),
        now()
      )
    ON CONFLICT (tenant_id, MONTH) DO NOTHING
    RETURNING
      id
  `);

  if (rows.length === 0) {
    return;
  }

  const { docs: topUsers } = await payload.find({
    collection: 'translation-usage',
    where: {
      and: [
        { tenantId: { equals: context.tenantId } },
        { month: { equals: month } },
      ],
    },
    sort: '-billedCharacters',
    limit: 5,
    depth: 0,
  });

  await sendTranslationUsageAlertEmail(payload, {
    tenantId: context.tenantId,
    tenantName: context.tenantName,
    month,
    totalUsd: charactersToUsd(totals.tenant, limits.pricePerMillionCharacters),
    thresholdUsd: limits.alertThresholdUsd,
    topUsers: topUsers.map((row) => ({
      email: row.userEmail,
      usd: charactersToUsd(
        row.billedCharacters,
        limits.pricePerMillionCharacters,
      ),
    })),
  });
}

/**
 * Runs `translate` with a meter when `context`'s user is within this
 * month's limits, and records what it used. Returns `{ skipped }` without
 * calling `translate` when a limit is reached. Recording (and the alert
 * email) happen after the response is sent and never fail the save.
 */
export async function runMeteredTranslation<T>(
  context: TranslationUsageContext,
  translate: (meter: TranslationMeter) => Promise<T>,
): Promise<{ skipped: false; result: T } | { skipped: true }> {
  let allowance: TranslationAllowance;
  try {
    allowance = await getTranslationAllowance(
      context.tenantId,
      context.userEmail,
    );
  } catch (error) {
    // Fail open: a metering outage must not block translation.
    log.error({ err: error }, 'Failed to check translation allowance');
    allowance = { allowed: true };
  }

  if (!allowance.allowed) {
    log.info(
      { tenantId: context.tenantId, reason: allowance.reason },
      'Skipping automatic translation: monthly limit reached',
    );
    return { skipped: true };
  }

  const meter = createTranslationMeter();

  try {
    return { skipped: false, result: await translate(meter) };
  } finally {
    // Also on failure: calls that already reached the provider are billed.
    if (meter.requestedCharacters > 0) {
      after(async () => {
        try {
          await recordUsage(await getPayloadSingleton(), context, meter);
        } catch (error) {
          log.error({ err: error }, 'Failed to record translation usage');
        }
      });
    }
  }
}
