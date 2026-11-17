import type { TypedLocale } from 'payload';

import type { PublicPageCategory } from '@/app/(app)/shared/utils/publicPageCategory';

/** What the proxy needs per host: `/api/getTenantBasicConfig` on the CMS. */
export type TenantBasicConfigResponse = {
  /**
   * The tenant's id and name, for the per-tenant load limits; null when the
   * host matches no tenant. Absent in configs cached before they were added.
   */
  tenantId?: string | null;
  name?: string | null;
  enabledLocales: TypedLocale[];
  defaultLocale: string;
  auth: {
    requiresLogin: boolean;
    allowedEmailDomains: string[];
    publicPages: PublicPageCategory[];
  };
  seo: {
    noindex: boolean;
  };
};
