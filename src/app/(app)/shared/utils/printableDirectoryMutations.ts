import initTranslations from '@/app/(app)/shared/i18n/i18n';
import {
  PrintableDirectoryResponseDto,
  UpdatePrintableDirectoryDto,
} from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';
import { createLogger } from '@/lib/logger';

import { PrintableDirectoryMutationResult } from '../serverActions/printableDirectories/printableDirectoryMutationResult';
import type { TranslationMeter } from '../services/translation-usage/translation-meter';
import { runMeteredTranslation } from '../services/translation-usage/translation-usage-service';
import {
  getDirectoryAutoTranslationUpdate,
  getSectionAutoTranslationUpdate,
} from './autoTranslatePrintableDirectoryText';
import {
  PrintableDirectoryServerAccess,
  getApiErrorStatus,
  getTranslationUsageContext,
} from './printableDirectoryServerAccess';

const log = createLogger('printableDirectoryMutations');

/**
 * Server-only building blocks for the printable directory server actions.
 * They do NOT check access themselves: callers must have obtained a
 * `PrintableDirectoryServerAccess` first. Not a `'use server'` module, so
 * nothing here is callable from the browser.
 */

export async function fetchPrintableDirectory(
  id: string,
  tenantId: string,
): Promise<PrintableDirectoryResponseDto | null> {
  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerGetById(
        { id },
        {
          cache: 'no-store',
          headers: await getApiHeaders(tenantId, 'en', true),
        },
      );

    return response.data ?? null;
  } catch {
    return null;
  }
}

async function callUpdate(
  id: string,
  input: UpdatePrintableDirectoryDto,
  tenantId: string,
): Promise<PrintableDirectoryMutationResult> {
  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerUpdate(
        { id },
        input,
        {
          cache: 'no-store',
          headers: await getApiHeaders(tenantId, 'en', true),
        },
      );

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: getApiErrorStatus(error) === 409 ? 'slug_taken' : 'unknown',
    };
  }
}

/**
 * Applies `input`, then — for users with the Automatic Translation
 * capability — machine-translates into the directory's `locales`
 * (synchronously, per docs/adr/0003-printable-directory-translation-model.md):
 * the localized fields `input` touched or, when `input` changes `locales`,
 * the whole directory, so newly added languages get content. Skipped once
 * the user or tenant reaches a monthly limit (docs/translation-usage.md).
 */
export async function updatePrintableDirectoryContent(
  id: string,
  input: UpdatePrintableDirectoryDto,
  tenantId: string,
  access: PrintableDirectoryServerAccess,
): Promise<PrintableDirectoryMutationResult> {
  const result = await callUpdate(id, input, tenantId);

  if (!result.success || !access.hasCapability('automaticTranslation')) {
    return result;
  }

  try {
    const translateEverything = input.locales !== undefined;
    const metered = await runMeteredTranslation(
      getTranslationUsageContext(access),
      async (meter) => {
        const translationUpdate = await getDirectoryAutoTranslationUpdate(
          result.data,
          translateEverything ? ALL_DIRECTORY_FIELDS : input,
          meter,
        );

        let directory = result.data;

        if (translationUpdate) {
          const translated = await callUpdate(id, translationUpdate, tenantId);
          if (translated.success) {
            directory = translated.data;
          }
        }

        if (translateEverything) {
          directory = await translateAllSections(directory, tenantId, meter);
        }

        return directory;
      },
    );

    return metered.skipped ? result : { success: true, data: metered.result };
  } catch {
    // The save itself succeeded; a translation outage must not turn it into
    // a failure.
    return result;
  }
}

/** Marks every directory-level localized field as touched. */
const ALL_DIRECTORY_FIELDS: UpdatePrintableDirectoryDto = {
  cover: { titleLocalized: {}, descriptionLocalized: {} },
  header: { layout: [], textLocalized: {} },
  footer: { layout: [], textLocalized: {} },
};

async function translateAllSections(
  directory: PrintableDirectoryResponseDto,
  tenantId: string,
  meter: TranslationMeter,
): Promise<PrintableDirectoryResponseDto> {
  let latest = directory;
  const headers = await getApiHeaders(tenantId, 'en', true);

  for (const section of directory.sections) {
    // One section failing must not discard the ones already translated:
    // they are saved, so the caller should get the directory with them.
    try {
      const update = await getSectionAutoTranslationUpdate(
        section,
        directory.primaryLanguage,
        directory.locales,
        meter,
      );
      if (!update) {
        continue;
      }

      const response =
        await printableDirectoriesApiClient.printableDirectoryControllerUpdateSection(
          { id: directory.id, sectionId: section.id },
          update,
          { cache: 'no-store', headers },
        );
      latest = response.data ?? latest;
    } catch (error) {
      log.warn(
        { err: error, directoryId: directory.id, sectionId: section.id },
        'Failed to auto-translate section; continuing with the rest',
      );
    }
  }

  return latest;
}

/**
 * Defaults every new directory starts with, so the wizard asks for nothing
 * but a name: the cover title matches the name, the header shows the
 * website, logo and date, and the footer shows the disclaimer — in each of
 * the directory's languages, from the app's own translations.
 */
export async function getDefaultPrintableDirectoryContent(
  name: string,
  primaryLanguage: string,
  locales: string[],
  access: PrintableDirectoryServerAccess,
): Promise<UpdatePrintableDirectoryDto> {
  const { appConfig } = access;
  const { t } = await initTranslations(
    primaryLanguage,
    ['page-list'],
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );
  const disclaimers = Object.fromEntries(
    locales.map((locale) => [
      locale,
      t('print_footer_disclaimer', {
        ns: 'page-list',
        lng: locale,
        brandName: appConfig.brand.name,
        interpolation: { escapeValue: false },
      }),
    ]),
  );

  return {
    cover: {
      titleLocalized: { values: { [primaryLanguage]: name } },
    },
    header: {
      layout: ['domain', 'logo', 'date'],
      textLocalized: { values: {} },
    },
    footer: {
      layout: ['text'],
      // Human translations, not machine ones: never overwritten.
      textLocalized: { values: disclaimers, autoTranslatedLocales: [] },
    },
  };
}
