import { TypedLocale } from 'payload';

export const defaultLocale = 'en';

export const locales = [
  'am', // Amharic
  'ar', // Arabic
  'de', // German
  'en', // English
  'es', // Spanish
  'fa', // Farsi (Persian)
  'fi', // Finnish
  'fil', // Filipino
  'ff', // Fulah
  'fr', // French
  'hi', // Hindi
  'hr', // Croatian
  'ht', // Haitian Creole
  'ko', // Korean
  'km', // Khmer
  'lo', // Lao
  'mww', // Hmong
  'ne', // Nepali
  'om', // Oromo
  'or', // Odia
  'pl', // Polish
  'ps', // Pashto
  'prs', // Dari
  'pt', // Portuguese
  'ru', // Russian
  'so', // Somali
  'sw', // Swahili
  'uk', // Ukrainian
  'vi', // Vietnamese
  'yue', // Cantonese
  'zh-Hans', // Chinese (Simplified)
  'zh-Hant', // Chinese (Traditional)
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
