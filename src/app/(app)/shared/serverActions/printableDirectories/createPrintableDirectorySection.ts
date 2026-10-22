'use server';

import {
  PrintableDirectoryLocalizedValuesDto,
  PrintableDirectoryResponseDto,
} from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

import { runMeteredTranslation } from '../../services/translation-usage/translation-usage-service';
import { getSectionAutoTranslationUpdate } from '../../utils/autoTranslatePrintableDirectoryText';
import { fetchPrintableDirectory } from '../../utils/printableDirectoryMutations';
import {
  getPrintableDirectoryServerAccess,
  getTranslationUsageContext,
} from '../../utils/printableDirectoryServerAccess';

type CreatePrintableDirectorySectionInput = {
  headingLocalized: PrintableDirectoryLocalizedValuesDto;
  descriptionLocalized: PrintableDirectoryLocalizedValuesDto;
  maxResources?: number;
};

/**
 * Creates a section. A plain string `input` is a heading in the directory's
 * primary language. For users with the Automatic Translation capability the
 * new section is machine-translated before this resolves.
 */
export async function createPrintableDirectorySection(
  directoryId: string,
  input: string | CreatePrintableDirectorySectionInput,
  tenantId: string,
): Promise<PrintableDirectoryResponseDto | null> {
  const access = await getPrintableDirectoryServerAccess(tenantId);

  if (!access) {
    return null;
  }

  let payload: CreatePrintableDirectorySectionInput;

  if (typeof input === 'string') {
    const directory = await fetchPrintableDirectory(directoryId, tenantId);
    if (!directory) {
      return null;
    }

    payload = {
      headingLocalized: { values: { [directory.primaryLanguage]: input } },
      descriptionLocalized: { values: {} },
    };
  } else {
    payload = input;
  }

  const headers = await getApiHeaders(tenantId, 'en', true);

  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerCreateSection(
        { id: directoryId },
        payload,
        { cache: 'no-store', headers },
      );

    const updatedDirectory = response.data ?? null;

    if (!updatedDirectory || !access.hasCapability('automaticTranslation')) {
      return updatedDirectory;
    }

    // The API appends new sections last.
    const newestSection = [...updatedDirectory.sections].sort(
      (first, second) => first.order - second.order,
    )[updatedDirectory.sections.length - 1];

    if (!newestSection) {
      return updatedDirectory;
    }

    try {
      const metered = await runMeteredTranslation(
        getTranslationUsageContext(access),
        async (meter) => {
          const translationUpdate = await getSectionAutoTranslationUpdate(
            newestSection,
            updatedDirectory.primaryLanguage,
            updatedDirectory.locales,
            meter,
          );

          if (!translationUpdate) {
            return updatedDirectory;
          }

          const translatedResponse =
            await printableDirectoriesApiClient.printableDirectoryControllerUpdateSection(
              { id: directoryId, sectionId: newestSection.id },
              translationUpdate,
              { cache: 'no-store', headers },
            );

          return translatedResponse.data ?? updatedDirectory;
        },
      );

      return metered.skipped ? updatedDirectory : metered.result;
    } catch {
      return updatedDirectory;
    }
  } catch {
    return null;
  }
}
