/** The directory's languages with the primary language first. */
export const orderLocales = (locales: string[], primaryLanguage: string) => [
  primaryLanguage,
  ...locales.filter((locale) => locale !== primaryLanguage),
];
