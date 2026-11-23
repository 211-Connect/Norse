/**
 * The host a tenant's canonical tags, hreflang links and sitemap URLs name
 * (docs/landing-pages.md, docs/seo.md): `seo.canonicalHost` when set, else
 * the first trusted domain. Pure, shared by the CMS and the public app.
 */

/** `https://Search.Example.org:443/x` → `search.example.org`. */
export function bareHost(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '');
}

type TenantHosts = {
  seo?: { canonicalHost?: string | null } | null;
  trustedDomains?: { domain: string }[] | null;
};

/** The tenant's canonical host, or null when it has no domain at all. */
export function tenantCanonicalHost(
  tenant: TenantHosts | null | undefined,
): string | null {
  const explicit = bareHost(tenant?.seo?.canonicalHost ?? '');
  if (explicit) return explicit;
  return (
    (tenant?.trustedDomains ?? [])
      .map(({ domain }) => bareHost(domain))
      .find(Boolean) ?? null
  );
}

/**
 * Why a canonical host is invalid, or null: it must be a bare host that is
 * one of the tenant's trusted domains, so canonicals never point at a host
 * Norse does not serve for that tenant.
 */
export function canonicalHostProblem(
  value: string | null | undefined,
  trustedDomains: { domain?: string | null }[] | null | undefined,
): string | null {
  if (!value) return null;
  if (value !== bareHost(value)) {
    return 'Enter a host only, e.g. search.example.org (no https://, path or port).';
  }
  const trusted = (trustedDomains ?? []).map(({ domain }) =>
    bareHost(domain ?? ''),
  );
  return trusted.includes(value)
    ? null
    : "Use one of this site's trusted domains.";
}
