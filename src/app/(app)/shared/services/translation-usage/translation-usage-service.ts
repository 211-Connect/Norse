import { after } from 'next/server';

import { createLogger } from '@/lib/logger';
import {
  getTranslationAllowance,
  recordTranslationUsage,
} from '@/lib/cms/translation-usage';

import { TranslationMeter, createTranslationMeter } from './translation-meter';
import type {
  TranslationAllowance,
  TranslationUsageContext,
} from './translation-usage-store';

/**
 * Metering and limits for printable directory auto-translation, as the
 * public app uses them. The totals live in the CMS database
 * (`translation-usage-store.ts`). See docs/translation-usage.md.
 */

export type { TranslationAllowance, TranslationUsageContext };
export { getTranslationAllowance };

const log = createLogger('translationUsage');

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
          await recordTranslationUsage(context, {
            billedCharacters: meter.billedCharacters,
            requestedCharacters: meter.requestedCharacters,
            largestFieldCharacters: meter.largestFieldCharacters,
            locales: meter.locales,
          });
        } catch (error) {
          log.error({ err: error }, 'Failed to record translation usage');
        }
      });
    }
  }
}
