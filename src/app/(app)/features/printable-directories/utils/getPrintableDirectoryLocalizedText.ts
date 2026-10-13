import { PrintableDirectoryLocalizedTextResponseDto } from '@/lib/api/generated/data-contracts';

/**
 * The text in `locale`, else in the directory's primary language (the
 * language it was written in). Blank values count as missing. Mirrors the
 * Norse API's resolution of section headings/descriptions in previews.
 */
export const getPrintableDirectoryLocalizedText = (
  value: PrintableDirectoryLocalizedTextResponseDto | undefined,
  locale: string,
  primaryLanguage: string,
): string => {
  const values = value?.values ?? {};

  return (
    [values[locale], values[primaryLanguage]].find((text) => text?.trim()) ?? ''
  );
};
