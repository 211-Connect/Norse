import type { CachedAppConfig } from '@/app/(app)/shared/utils/buildAppConfig';
import type {
  PublicAppConfig,
  PublicAppConfigLegalPage,
  PublicAppConfigMenuItem,
} from '@/types/publicAppConfig';

/** Redis DB 2 key Norse-API reads for `GET /tenant-config/:tenantId`. */
export const getPublicAppConfigKey = (tenantId: string, locale: string) =>
  `public_app_config:${tenantId}:${locale}`;

type Menu = CachedAppConfig['header']['customMenu'];
type LegalPage = CachedAppConfig['pages']['accessibilityPage'];

const toMenu = (menu: Menu | undefined): PublicAppConfigMenuItem[] =>
  (menu ?? [])
    .filter((item) => Boolean(item?.name))
    .map((item) => ({
      name: item.name,
      href: item.href ?? undefined,
      openInNewTab: item.openInNewTab ?? undefined,
    }));

/** Title and switch only: the page content is not needed outside Norse. */
const toLegalPage = (
  page: LegalPage | undefined,
): PublicAppConfigLegalPage => ({
  enabled: page?.enabled ?? false,
  title: page?.title,
});

/**
 * Picks the fields listed in `PublicAppConfig` from a built app config. An
 * allowlist by construction: a field added to `AppConfig` stays inside the
 * CMS until it is added here.
 */
export function toPublicAppConfig(
  tenantId: string,
  locale: string,
  config: CachedAppConfig,
): PublicAppConfig {
  return {
    tenantId,
    locale,
    brand: {
      name: config.brand.name,
      logoUrl: config.brand.logoUrl,
      faviconUrl: config.brand.faviconUrl,
      openGraphUrl: config.brand.openGraphUrl,
      theme: {
        primaryColor: config.brand.theme.primaryColor,
        secondaryColor: config.brand.theme.secondaryColor,
        borderRadius: config.brand.theme.borderRadius,
      },
    },
    meta: {
      title: config.meta.title,
      description: config.meta.description,
    },
    contact: { number: config.contact.number },
    header: {
      customHomeUrl: config.header.customHomeUrl,
      customMenu: toMenu(config.header.customMenu),
      feedbackUrl: config.header.feedbackUrl,
    },
    footer: {
      customMenu: toMenu(config.footer.customMenu),
      copyright: config.footer.copyright,
      disclaimer: config.footer.disclaimer,
    },
    pages: {
      accessibilityPage: toLegalPage(config.pages.accessibilityPage),
      privacyPolicyPage: toLegalPage(config.pages.privacyPolicyPage),
      termsOfUsePage: toLegalPage(config.pages.termsOfUsePage),
    },
    heroUrl: config.heroUrl,
    alerts: (config.alerts ?? []).map((alert) => ({
      text: alert.text,
      buttonText: alert.buttonText,
      url: alert.url,
      target: alert.target,
      variant: alert.variant,
    })),
    i18n: {
      defaultLocale: config.i18n.defaultLocale,
      locales: [...config.i18n.locales],
    },
    newLayout: config.newLayout
      ? {
          enabled: config.newLayout.enabled,
          headerStart: config.newLayout.headerStart,
          headerEnd: config.newLayout.headerEnd,
        }
      : undefined,
    search: {
      map: {
        center: [config.search.map.center[0], config.search.map.center[1]],
        zoom: config.search.map.zoom,
      },
      defaultRadius: config.search.defaultRadius,
    },
  };
}
