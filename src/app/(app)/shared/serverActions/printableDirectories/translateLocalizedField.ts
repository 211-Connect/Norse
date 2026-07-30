'use server';

import { defaultLocale, isValidLocale } from '@/payload/i18n/locales';
import { batchTranslate } from '@/payload/services/translationService';

import { canAccessPrintableDirectories } from '../../utils/canAccessPrintableDirectories';
import { getSession } from '../../utils/getServerSession';
import { getAppConfigWithoutHost } from '../../utils/appConfig';
import { logger } from '@/lib/logger';

type TranslateLocalizedFieldInput = {
  englishValue: string;
};

type TranslateLocalizedFieldError =
  'unauthorized' | 'missing_source' | 'not_configured' | 'translation_failed';

export type TranslateLocalizedFieldResult =
  | {
      success: true;
      translations: Record<string, string>;
    }
  | {
      success: false;
      error: TranslateLocalizedFieldError;
    };

export async function translateLocalizedField(
  input: TranslateLocalizedFieldInput,
): Promise<TranslateLocalizedFieldResult> {
  const session = await getSession();
  const appConfig = await getAppConfigWithoutHost(defaultLocale);

  if (!canAccessPrintableDirectories(session?.user?.email, appConfig)) {
    return {
      success: false,
      error: 'unauthorized',
    };
  }

  const englishValue = input.englishValue.trim();
  if (!englishValue) {
    return {
      success: false,
      error: 'missing_source',
    };
  }

  const targetLocales = appConfig.i18n.locales.filter(
    (locale) => locale !== 'en' && isValidLocale(locale),
  );

  if (targetLocales.length === 0) {
    return {
      success: true,
      translations: {},
    };
  }

  try {
    const translations = await batchTranslate(
      'google',
      targetLocales.map((targetLocale) => ({
        text: englishValue,
        targetLocale,
      })),
    );

    return {
      success: true,
      translations: translations.reduce<Record<string, string>>(
        (accumulator, result) => {
          accumulator[result.targetLocale] = result.translatedText;
          return accumulator;
        },
        {},
      ),
    };
  } catch (error) {
    logger.error(
      {
        error,
      },
      'Error translating localized field',
    );
    return {
      success: false,
      error: 'translation_failed',
    };
  }
}
