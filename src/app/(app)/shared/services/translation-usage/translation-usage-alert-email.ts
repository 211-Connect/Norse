import type { Payload } from 'payload';

import { createLogger } from '@/lib/logger';

const log = createLogger('translationUsageAlertEmail');

type TranslationUsageAlert = {
  tenantId: string;
  tenantName: string;
  month: string;
  totalUsd: number;
  thresholdUsd: number;
  topUsers: { email: string; usd: number }[];
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatUsd = (usd: number) => `$${usd.toFixed(2)}`;

async function getRecipients(payload: Payload): Promise<string[]> {
  const { docs } = await payload.find({
    collection: 'users',
    where: { roles: { in: ['super-admin', 'support'] } },
    limit: 0,
    pagination: false,
    depth: 0,
    select: { email: true },
  });

  return Array.from(
    new Set(docs.map((user) => user.email).filter(Boolean) as string[]),
  );
}

/**
 * Internal (English) alert to every super-admin and support user that a
 * tenant's monthly machine-translation cost reached the alert threshold.
 * See docs/translation-usage.md.
 */
export async function sendTranslationUsageAlertEmail(
  payload: Payload,
  alert: TranslationUsageAlert,
): Promise<void> {
  const recipients = await getRecipients(payload);

  if (recipients.length === 0) {
    log.warn(
      { tenantId: alert.tenantId },
      'No super-admin or support users to alert',
    );
    return;
  }

  const name = escapeHtml(alert.tenantName || alert.tenantId);
  const rows = alert.topUsers
    .map(
      ({ email, usd }) =>
        `<tr><td style="padding:4px 12px 4px 0">${escapeHtml(email)}</td><td style="padding:4px 0;text-align:right">${formatUsd(usd)}</td></tr>`,
    )
    .join('');

  await payload.sendEmail({
    // Recipients are internal staff; bcc keeps their addresses private.
    to: payload.email?.defaultFromAddress ?? recipients[0],
    bcc: recipients,
    subject: `[Norse] ${alert.tenantName || alert.tenantId}: automatic translation reached ${formatUsd(alert.thresholdUsd)} in ${alert.month}`,
    html: `
      <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1f2933">
        <p>Printable directory automatic translation for <strong>${name}</strong> (tenant <code>${escapeHtml(alert.tenantId)}</code>) has cost an estimated <strong>${formatUsd(alert.totalUsd)}</strong> in ${escapeHtml(alert.month)} (UTC), reaching the ${formatUsd(alert.thresholdUsd)} alert threshold.</p>
        <p>Top users this month:</p>
        <table style="border-collapse:collapse">${rows}</table>
        <p>See Resource Directories → Printable Directories → Translation usage for details, and to adjust the per-user quota or tenant hard cap. This alert is sent once per tenant per month.</p>
        <p style="color:#616e7c;font-size:13px">Estimates use list price and ignore the provider's free tier.</p>
      </div>
    `,
  });
}
