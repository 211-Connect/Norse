import {
  type TranslationUsage,
  type TranslationUsageContext,
  recordTranslationUsage,
} from '@/app/(app)/shared/services/translation-usage/translation-usage-store';
import { internalRoute } from '@/lib/cms/internal-route';

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

/** POST { context, usage } → records one save's translation usage. */
export const POST = internalRoute(async (request) => {
  const body = await request.json().catch(() => null);
  const context = body?.context as TranslationUsageContext | undefined;
  const usage = body?.usage as TranslationUsage | undefined;

  if (
    typeof context?.tenantId !== 'string' ||
    typeof context?.tenantName !== 'string' ||
    typeof context?.userEmail !== 'string' ||
    !isCount(usage?.billedCharacters) ||
    !isCount(usage?.requestedCharacters) ||
    !isCount(usage?.largestFieldCharacters) ||
    !Array.isArray(usage?.locales) ||
    !usage.locales.every((locale) => typeof locale === 'string')
  ) {
    return Response.json({ error: 'Invalid usage' }, { status: 400 });
  }

  await recordTranslationUsage(context, usage);
  return null;
});
