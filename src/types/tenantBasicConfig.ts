import type { TypedLocale } from 'payload';

import type { PublicPageCategory } from '@/app/(app)/shared/utils/publicPageCategory';

/** What the proxy needs per host: `/api/getTenantBasicConfig` on the CMS. */
export type TenantBasicConfigResponse = {
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
