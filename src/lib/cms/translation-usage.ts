import {
  type TranslationAllowance,
  type TranslationUsage,
  type TranslationUsageContext,
  readTranslationAllowance,
  recordTranslationUsage as recordTranslationUsageInDb,
} from '@/app/(app)/shared/services/translation-usage/translation-usage-store';

import { cmsRequest } from './client';
import { isCmsRemote } from './config';

/** Whether `userEmail` may still machine-translate this month. */
export async function getTranslationAllowance(
  tenantId: string,
  userEmail: string,
): Promise<TranslationAllowance> {
  if (!isCmsRemote()) return readTranslationAllowance(tenantId, userEmail);

  // POST: keeps the email out of URLs and access logs.
  return cmsRequest<TranslationAllowance>('translation-usage/allowance', {
    method: 'POST',
    body: { tenantId, userEmail },
  });
}

/** Records one save's translation usage (and sends the alert email). */
export async function recordTranslationUsage(
  context: TranslationUsageContext,
  usage: TranslationUsage,
): Promise<void> {
  if (!isCmsRemote()) return recordTranslationUsageInDb(context, usage);

  await cmsRequest<null>('translation-usage/record', {
    method: 'POST',
    body: { context, usage },
  });
}
