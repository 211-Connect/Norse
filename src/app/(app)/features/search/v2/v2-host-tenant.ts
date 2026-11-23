/**
 * Which tenant a v2 route call may read: the host's tenant, never the query's (Lucas, 2026-11-23,
 * adversarial-review finding 1 on PR #1222). v1 `/api/search-pins` already works this way; the v2
 * routes share this one function so the rule has one source.
 *
 * No server-only imports and the dependencies are passed in, so the unit tests can import it.
 */

export const DEFAULT_V2_LOCALE = 'en';

/** The slice of the app config this check reads. */
export type V2HostConfig = {
  tenantId: string;
  featureFlags: { enableV2Api?: boolean };
  i18n: { locales: readonly string[] };
  /** The tenant's Payload area settings, sent with an area search (`utils/area-settings`). */
  search?: { areaMatch?: unknown; unlocatedInAreaSearch?: unknown };
};

export type V2HostTenant =
  | {
      ok: true;
      tenantId: string;
      locale: string;
      search: V2HostConfig['search'];
    }
  | { ok: false; status: 400 | 404; error: string };

/**
 * `locale` is the browser's `locale` query value (`null` when absent, then English as in
 * `buildV2Url`). `getConfig` loads the config of the HOST's tenant. A `tenant_id` in the browser
 * query is not an input here: the caller passes `tenantId` from this result to the upstream call.
 *
 * - 400: `locale` is not a known locale code.
 * - 404: the host tenant has `enableV2Api` off, or does not offer the locale.
 */
export async function resolveV2HostTenant(
  locale: string | null,
  deps: {
    getConfig: (locale: string) => Promise<V2HostConfig>;
    isValidLocale: (locale: unknown) => boolean;
  },
): Promise<V2HostTenant> {
  const wanted = locale || DEFAULT_V2_LOCALE;
  if (!deps.isValidLocale(wanted)) {
    return { ok: false, status: 400, error: 'Invalid locale' };
  }
  const config = await deps.getConfig(wanted);
  if (!config.featureFlags.enableV2Api) {
    return { ok: false, status: 404, error: 'Not found' };
  }
  if (!config.i18n.locales.includes(wanted)) {
    return { ok: false, status: 404, error: 'Not found' };
  }
  return {
    ok: true,
    tenantId: config.tenantId,
    locale: wanted,
    search: config.search,
  };
}
