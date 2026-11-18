/**
 * The part of a tenant's app config that clients outside Norse read through
 * Norse-API (`GET /tenant-config/:tenantId`, field `appConfig`): the Connect211
 * mobile app and ServiceNet provider-feedback. The CMS writes it to Redis DB 2
 * as `public_app_config:<tenantId>:<locale>` on every resource-directory and
 * tenant save (`pushPublicAppConfigToCache`).
 *
 * Field names and nesting follow `AppConfig`. Only fields listed here leave
 * the CMS: `AppConfig` also holds data that must not, such as
 * `printableDirectories` (allowlisted email addresses).
 */
export type PublicAppConfigMenuItem = {
  name: string;
  href?: string;
  openInNewTab?: boolean;
};

export type PublicAppConfigLegalPage = {
  enabled: boolean;
  title?: string;
};

export type PublicAppConfigAlert = {
  text: string;
  buttonText?: string;
  url?: string;
  target?: '_self' | '_blank';
  variant?: 'destructive' | 'default';
};

export type PublicAppConfig = {
  tenantId: string;
  locale: string;
  brand: {
    name: string;
    logoUrl?: string;
    faviconUrl?: string;
    openGraphUrl?: string;
    theme: {
      primaryColor?: string;
      secondaryColor?: string;
      borderRadius?: string;
    };
  };
  meta: { title: string; description: string };
  contact: { number?: string };
  header: {
    customHomeUrl?: string;
    customMenu: PublicAppConfigMenuItem[];
    feedbackUrl?: string;
  };
  footer: {
    customMenu: PublicAppConfigMenuItem[];
    copyright?: string;
    disclaimer?: string;
  };
  pages: {
    accessibilityPage: PublicAppConfigLegalPage;
    privacyPolicyPage: PublicAppConfigLegalPage;
    termsOfUsePage: PublicAppConfigLegalPage;
  };
  heroUrl?: string;
  alerts: PublicAppConfigAlert[];
  i18n: { defaultLocale: string; locales: string[] };
  newLayout?: {
    enabled?: boolean;
    headerStart?: string;
    headerEnd?: string;
  };
  search: {
    /** `[longitude, latitude]`. */
    map: { center: [number, number]; zoom: number };
    defaultRadius?: number;
  };
};
