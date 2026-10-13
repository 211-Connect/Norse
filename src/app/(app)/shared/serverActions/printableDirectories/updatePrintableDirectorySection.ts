'use server';

import {
  PrintableDirectoryControllerUpdateSectionParams,
  PrintableDirectoryResponseDto,
  UpdatePrintableDirectorySectionDto,
} from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

import { getSectionAutoTranslationUpdate } from '../../utils/autoTranslatePrintableDirectoryText';
import { getPrintableDirectoryServerAccess } from '../../utils/printableDirectoryServerAccess';

async function callUpdateSection(
  params: PrintableDirectoryControllerUpdateSectionParams,
  input: UpdatePrintableDirectorySectionDto,
  tenantId: string,
): Promise<PrintableDirectoryResponseDto | null> {
  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerUpdateSection(
        params,
        input,
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

export async function updatePrintableDirectorySection(
  params: PrintableDirectoryControllerUpdateSectionParams,
  input: UpdatePrintableDirectorySectionDto,
  tenantId: string,
): Promise<PrintableDirectoryResponseDto | null> {
  const access = await getPrintableDirectoryServerAccess(tenantId);

  if (!access) {
    return null;
  }

  const updatedDirectory = await callUpdateSection(params, input, tenantId);

  if (
    !updatedDirectory ||
    (!input.headingLocalized && !input.descriptionLocalized) ||
    !access.hasCapability('automaticTranslation')
  ) {
    return updatedDirectory;
  }

  const section = updatedDirectory.sections.find(
    (candidate) => candidate.id === params.sectionId,
  );

  if (!section) {
    return updatedDirectory;
  }

  try {
    const translationUpdate = await getSectionAutoTranslationUpdate(
      section,
      updatedDirectory.primaryLanguage,
      updatedDirectory.locales,
    );

    if (!translationUpdate) {
      return updatedDirectory;
    }

    return (
      (await callUpdateSection(params, translationUpdate, tenantId)) ??
      updatedDirectory
    );
  } catch {
    return updatedDirectory;
  }
}
