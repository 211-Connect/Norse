'use server';

import { UpdatePrintableDirectoryDto } from '@/lib/api/generated/data-contracts';

import {
  getPrintableDirectoryServerAccess,
  getRequiredUpdateCapabilities,
} from '../../utils/printableDirectoryServerAccess';
import { updatePrintableDirectoryContent } from '../../utils/printableDirectoryMutations';
import { PrintableDirectoryMutationResult } from './printableDirectoryMutationResult';

export async function updatePrintableDirectory(
  id: string,
  input: UpdatePrintableDirectoryDto,
  tenantId: string,
): Promise<PrintableDirectoryMutationResult> {
  const access = await getPrintableDirectoryServerAccess(tenantId);

  if (!access) {
    return { success: false, error: 'unauthorized' };
  }

  // Premium fields (custom header/footer, logo, cover images) are gated by
  // the CMS-configured user groups.
  if (
    !getRequiredUpdateCapabilities(input).every((capability) =>
      access.hasCapability(capability),
    )
  ) {
    return { success: false, error: 'forbidden' };
  }

  return updatePrintableDirectoryContent(id, input, tenantId, access);
}
