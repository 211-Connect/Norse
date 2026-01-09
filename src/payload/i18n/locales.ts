import { TypedLocale } from 'payload';

export const defaultLocale = 'en';

export const locales = [
  'am',
  'ar',
  'de',
  'en',
  'es',
  'fi',
  'fil',
  'ff',
  'fr',
  'hi',
  'hr',
  'ht',
  'ko',
  'km',
  'ne',
  'om',
  'pl',
  'pt',
  'ru',
  'so',
  'sw',
  'uk',
  'vi',
  'yue',
  'zh-Hans',
  'zh-Hant',
];

const validLocaleCodes = new Set<string>(locales);

export function assertValidLocale(
  locale: string | undefined | null,
): asserts locale is TypedLocale {
  if (!locale) {
    throw new Error('Locale is required');
  }

  if (!validLocaleCodes.has(locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }
}
