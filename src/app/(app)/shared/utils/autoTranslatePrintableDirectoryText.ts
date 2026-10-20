import type { TranslationMeter } from '@/app/(app)/shared/services/translation-usage/translation-meter';
import { batchTranslate } from '@/payload/services/translationService';
import {
  PrintableDirectoryLocalizedTextResponseDto,
  PrintableDirectoryLocalizedValuesDto,
  PrintableDirectoryResponseDto,
  UpdatePrintableDirectoryDto,
  UpdatePrintableDirectorySectionDto,
} from '@/lib/api/generated/data-contracts';

type LocalizedText =
  | PrintableDirectoryLocalizedTextResponseDto
  | PrintableDirectoryLocalizedValuesDto
  | null
  | undefined;

type DirectorySection = PrintableDirectoryResponseDto['sections'][number];

/**
 * Computes the next `{ values, autoTranslatedLocales }` for one localized
 * field after its primary-language value has been saved, for a user who
 * holds the Automatic Translation capability. See
 * docs/printable-directories.md ("Localization & automatic translation") and
 * docs/adr/0003-printable-directory-translation-model.md.
 *
 * - Locales with a value that are NOT in `autoTranslatedLocales` are
 *   human-edited and protected: never overwritten.
 * - Every other target locale (the directory's `locales`; missing, or
 *   previously machine-translated) is (re)translated from the primary text.
 *   Machine translations for other locales are kept as they are.
 * - When the primary-language text was cleared, machine translations of it
 *   are removed rather than left stale.
 * - Returns `null` when nothing would change.
 * - `meter` records the characters sent for docs/translation-usage.md.
 */
export async function autoTranslatePrintableDirectoryText(
  current: LocalizedText,
  primaryLanguage: string,
  targetLocales: string[],
  meter: TranslationMeter,
): Promise<PrintableDirectoryLocalizedValuesDto | null> {
  const existingValues = current?.values ?? {};
  const existingAutoTranslatedLocales = new Set(
    current?.autoTranslatedLocales ?? [],
  );
  const sourceText = existingValues[primaryLanguage]?.trim();

  if (!sourceText) {
    if (existingAutoTranslatedLocales.size === 0) {
      return null;
    }

    return {
      values: Object.fromEntries(
        Object.entries(existingValues).filter(
          ([locale]) => !existingAutoTranslatedLocales.has(locale),
        ),
      ),
      autoTranslatedLocales: [],
    };
  }

  const localesToTranslate = targetLocales.filter(
    (locale) =>
      locale !== primaryLanguage &&
      (!existingValues[locale]?.trim() ||
        existingAutoTranslatedLocales.has(locale)),
  );

  if (localesToTranslate.length === 0) {
    return null;
  }

  const translations = await batchTranslate(
    'google',
    localesToTranslate.map((targetLocale) => ({
      text: sourceText,
      targetLocale,
    })),
    primaryLanguage,
  );
  meter.record(translations);

  const nextValues: Record<string, string> = { ...existingValues };
  for (const result of translations) {
    nextValues[result.targetLocale] = result.translatedText;
  }

  // Re-translating unchanged text (the usual case: translations are
  // cached) yields the same values; skip the follow-up update then.
  const isUnchanged = localesToTranslate.every(
    (locale) =>
      existingAutoTranslatedLocales.has(locale) &&
      existingValues[locale] === nextValues[locale],
  );
  if (isUnchanged) {
    return null;
  }

  return {
    values: nextValues,
    autoTranslatedLocales: Array.from(
      new Set([...existingAutoTranslatedLocales, ...localesToTranslate]),
    ),
  };
}

/**
 * The follow-up update that machine-translates the cover/header/footer
 * fields touched by `input` into the directory's `locales`, or `null` when
 * there is nothing to translate.
 */
export async function getDirectoryAutoTranslationUpdate(
  directory: PrintableDirectoryResponseDto,
  input: UpdatePrintableDirectoryDto,
  meter: TranslationMeter,
): Promise<UpdatePrintableDirectoryDto | null> {
  const translate = (text: LocalizedText, touched: unknown) =>
    touched
      ? autoTranslatePrintableDirectoryText(
          text,
          directory.primaryLanguage,
          directory.locales,
          meter,
        )
      : Promise.resolve(null);

  const [coverTitle, coverDescription, headerText, footerText] =
    await Promise.all([
      translate(directory.cover.titleLocalized, input.cover?.titleLocalized),
      translate(
        directory.cover.descriptionLocalized,
        input.cover?.descriptionLocalized,
      ),
      translate(directory.header.textLocalized, input.header?.textLocalized),
      translate(directory.footer.textLocalized, input.footer?.textLocalized),
    ]);

  const update: UpdatePrintableDirectoryDto = {};

  if (coverTitle || coverDescription) {
    update.cover = {
      ...(coverTitle ? { titleLocalized: coverTitle } : {}),
      ...(coverDescription ? { descriptionLocalized: coverDescription } : {}),
    };
  }
  if (headerText) {
    update.header = {
      layout: directory.header.layout,
      textLocalized: headerText,
    };
  }
  if (footerText) {
    update.footer = {
      layout: directory.footer.layout,
      textLocalized: footerText,
    };
  }

  return Object.keys(update).length > 0 ? update : null;
}

/**
 * The follow-up section update that machine-translates the heading and
 * description into `targetLocales`, or `null` when there is nothing to
 * translate.
 */
export async function getSectionAutoTranslationUpdate(
  section: DirectorySection,
  primaryLanguage: string,
  targetLocales: string[],
  meter: TranslationMeter,
): Promise<UpdatePrintableDirectorySectionDto | null> {
  const [heading, description] = await Promise.all([
    autoTranslatePrintableDirectoryText(
      section.headingLocalized,
      primaryLanguage,
      targetLocales,
      meter,
    ),
    autoTranslatePrintableDirectoryText(
      section.descriptionLocalized,
      primaryLanguage,
      targetLocales,
      meter,
    ),
  ]);

  if (!heading && !description) {
    return null;
  }

  return {
    ...(heading ? { headingLocalized: heading } : {}),
    ...(description ? { descriptionLocalized: description } : {}),
  };
}
