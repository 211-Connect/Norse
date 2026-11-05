import type {
  TranslationAllowance,
  TranslationUsage,
  TranslationUsageContext,
} from '@/app/(app)/shared/services/translation-usage/translation-usage-store';

import { cmsRequest } from './client';
import { isCmsRemote } from './config';

/** Whether `userEmail` may still machine-translate this month. */
export async function getTranslationAllowance(
  tenantId: string,
  userEmail: string,
): Promise<TranslationAllowance> {
  // Dropped from the public app's build (see ./tenants.ts).
  if (process.env.NORSE_BUILD !== 'app') {
    if (!isCmsRemote()) {
      // Inline, not a shared helper: the import must sit inside the branch
      // for the public app's build to drop it.
      const { readTranslationAllowance } =
        await import('@/app/(app)/shared/services/translation-usage/translation-usage-store');
      return readTranslationAllowance(tenantId, userEmail);
    }
  }

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
  if (process.env.NORSE_BUILD !== 'app') {
    if (!isCmsRemote()) {
      const { recordTranslationUsage: recordInDb } =
        await import('@/app/(app)/shared/services/translation-usage/translation-usage-store');
      return recordInDb(context, usage);
    }
  }

  await cmsRequest<null>('translation-usage/record', {
    method: 'POST',
    body: { context, usage },
  });
}
