const LANGUAGE_NAME: Record<string, string> = {
  ff: 'Fulfulde',
  fj: 'Fijian',
  mww: 'Hmong',
  tl: 'Tagalog',
};

type LanguageNameOptions = {
  displayLocale?: string;
};

export function getLanguageName(
  locale: string,
  options?: LanguageNameOptions,
): string {
  const displayLocale = options?.displayLocale ?? locale;

  if (LANGUAGE_NAME[locale]) {
    return LANGUAGE_NAME[locale];
  }

  try {
    return (
      new Intl.DisplayNames([displayLocale], {
        type: 'language',
      }).of(locale) ?? locale
    );
  } catch {
    return locale;
  }
}
