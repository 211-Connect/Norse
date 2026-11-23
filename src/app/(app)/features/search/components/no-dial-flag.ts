/**
 * The no-dial switch (Lucas, 2026-11-20): while on, no 911, 988, help line or provider phone dials
 * or texts on a v2 tenant. Every real number is already wired to `tel:` behind it.
 *
 * `NO_DIAL` is the default and stays `true` in every environment. The turn-on (the PR the 11-20
 * decision requires before v2 production go-live) is per tenant: the server env
 * `V2_DIAL_TENANT_IDS` lists the tenant ids whose v2 site dials (comma separated, exact ids, no
 * wildcard). `buildAppConfig` reads it and sets `featureFlags.v2DialingEnabled` for that tenant.
 * Unset, empty or a tenant not in the list: no dial, as before. v1 tenants always dial.
 *
 * No React and no server-only imports, so the unit tests can import it.
 */
export const NO_DIAL = true;

export const V2_DIAL_TENANTS_ENV = 'V2_DIAL_TENANT_IDS';

/** True only when `tenantId` is an exact entry of the comma separated list. */
export function dialingAllowed(
  tenantId: string | null | undefined,
  list: string | null | undefined,
): boolean {
  if (!tenantId || !list) return false;
  return list
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(tenantId);
}

/** No number dials or texts: the tenant is on v2, the switch is on, and the tenant is not turned on. */
export function noDialFor(flags: {
  enableV2Api?: boolean;
  v2DialingEnabled?: boolean;
}): boolean {
  return (
    NO_DIAL && flags.enableV2Api === true && flags.v2DialingEnabled !== true
  );
}
