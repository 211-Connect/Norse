import { UpdatePrintableDirectoryDto } from '@/lib/api/generated/data-contracts';
import { AppConfig, PrintableDirectoryCapability } from '@/types/appConfig';

import { getAppConfigWithoutHost } from './appConfig';
import {
  canAccessPrintableDirectories,
  getUserPrintableDirectoryCapabilities,
} from './canAccessPrintableDirectories';
import { getSession } from './getServerSession';

/**
 * Server-only helpers shared by the printable directory server actions. Not
 * a `'use server'` module on purpose: anything exported from one of those
 * becomes a publicly callable action.
 */

export type PrintableDirectoryServerAccess = {
  appConfig: AppConfig;
  hasCapability: (capability: PrintableDirectoryCapability) => boolean;
};

/**
 * Norse is the authoritative enforcer of tenant-level printable directory
 * access (docs/adr/0001-printable-directory-authz-boundary.md). Returns
 * `null` when the current user has no basic access, or when the client
 * supplied a tenant id other than the one the request host resolves to.
 */
export async function getPrintableDirectoryServerAccess(
  tenantId: string,
  locale: string = 'en',
): Promise<PrintableDirectoryServerAccess | null> {
  const [session, appConfig] = await Promise.all([
    getSession(),
    getAppConfigWithoutHost(locale),
  ]);
  const userEmail = session?.user?.email;

  if (
    tenantId !== appConfig.tenantId ||
    !canAccessPrintableDirectories(userEmail, appConfig)
  ) {
    return null;
  }

  const capabilities = getUserPrintableDirectoryCapabilities(
    userEmail,
    appConfig,
  );

  return {
    appConfig,
    hasCapability: (capability) => capabilities.has(capability),
  };
}

/**
 * The generated API client throws the failed `Response` itself, so the HTTP
 * status has to be read from the caught value.
 */
export function getApiErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const { status } = error as { status: unknown };
    return typeof status === 'number' ? status : undefined;
  }

  return undefined;
}

/**
 * Which premium capabilities an update needs. Name, share URL, access
 * policy, languages, default location and the cover title and description
 * are basic; see docs/printable-directories.md ("Access control").
 */
export function getRequiredUpdateCapabilities(
  input: UpdatePrintableDirectoryDto,
): PrintableDirectoryCapability[] {
  const required = new Set<PrintableDirectoryCapability>();
  const { cover } = input;

  if (input.header !== undefined || input.footer !== undefined) {
    required.add('customHeadersFooters');
  }
  if (input.logoUrl !== undefined) {
    required.add('logoUpload');
  }
  if (
    cover?.coverImageUrlFront !== undefined ||
    cover?.coverImageUrlBack !== undefined ||
    cover?.primaryColor !== undefined ||
    cover?.layoutType !== undefined
  ) {
    required.add('coverCustomization');
  }

  return [...required];
}
