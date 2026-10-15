'use server';

import { CreatePrintableDirectoryDto } from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

import {
  getApiErrorStatus,
  getPrintableDirectoryServerAccess,
} from '../../utils/printableDirectoryServerAccess';
import {
  getDefaultPrintableDirectoryContent,
  updatePrintableDirectoryContent,
} from '../../utils/printableDirectoryMutations';
import { PrintableDirectoryMutationResult } from './printableDirectoryMutationResult';

/**
 * Creates a directory and applies its default cover title, header and
 * footer. The defaults are applied here, on the server, so they don't
 * require the premium capabilities that editing those parts does.
 *
 * Unless `input.locales` says otherwise, users with Automatic Translation
 * start with every tenant language (filled automatically), everyone else
 * with the primary language only.
 */
export async function createPrintableDirectory(
  input: CreatePrintableDirectoryDto,
  tenantId: string,
): Promise<PrintableDirectoryMutationResult> {
  const access = await getPrintableDirectoryServerAccess(tenantId);

  if (!access) {
    return { success: false, error: 'unauthorized' };
  }

  if (input.logoUrl && !access.hasCapability('logoUpload')) {
    return { success: false, error: 'forbidden' };
  }

  const locales =
    input.locales ??
    (access.hasCapability('automaticTranslation')
      ? access.appConfig.i18n.locales
      : [input.primaryLanguage]);

  let created: PrintableDirectoryMutationResult;

  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerCreate(
        { locale: 'en', tenant_id: tenantId },
        { ...input, locales },
        {
          cache: 'no-store',
          headers: await getApiHeaders(tenantId, 'en', true),
        },
      );

    created = { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: getApiErrorStatus(error) === 409 ? 'slug_taken' : 'unknown',
    };
  }

  try {
    const defaults = await getDefaultPrintableDirectoryContent(
      input.name,
      input.primaryLanguage,
      created.data.locales,
      access,
    );
    const withDefaults = await updatePrintableDirectoryContent(
      created.data.id,
      defaults,
      tenantId,
      access,
    );

    // The directory exists either way; defaults are a convenience and stay
    // editable afterwards.
    return withDefaults.success ? withDefaults : created;
  } catch {
    return created;
  }
}
