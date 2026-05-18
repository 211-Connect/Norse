import type { Payload } from 'payload';

import type { ResourceDirectory } from '@/payload/payload-types';
import type { LegalConfig } from '@/types/legalConfig';

import { buildLocaleConfigMap } from './buildLocaleConfigMap';

function buildLegalForLocale(
  resourceDirectory: ResourceDirectory,
  tenantId: string,
  locale: string,
): LegalConfig {
  return {
    tenantId,
    locale,
    revision: resourceDirectory.updatedAt ?? new Date().toISOString(),
    resolvedFrom: {
      source: 'payload',
      resourceDirectoryId: resourceDirectory.id,
    },
    privacyPolicy: {
      enabled: resourceDirectory.privacyPolicyPage?.enabled ?? false,
      title: resourceDirectory.privacyPolicyPage?.title ?? undefined,
      content: resourceDirectory.privacyPolicyPage?.content ?? undefined,
    },
    termsOfUse: {
      enabled: resourceDirectory.termsOfUsePage?.enabled ?? false,
      title: resourceDirectory.termsOfUsePage?.title ?? undefined,
      content: resourceDirectory.termsOfUsePage?.content ?? undefined,
    },
  };
}

/**
 * Builds a LegalConfig snapshot for each enabled locale of a tenant.
 * Returns a map of locale -> LegalConfig, or null if the resource
 * directory cannot be resolved for any locale.
 */
export async function buildLegalConfigCache(
  payload: Payload,
  tenantId: string,
  enabledLocales: string[],
  currentDoc: ResourceDirectory,
  currentLocale: string | undefined,
): Promise<Map<string, LegalConfig> | null> {
  return buildLocaleConfigMap(
    payload,
    tenantId,
    enabledLocales,
    currentDoc,
    currentLocale,
    buildLegalForLocale,
    'legal config',
  );
}
