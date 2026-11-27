/**
 * The host a tenant's canonical tags, hreflang links and sitemap URLs name
 * (docs/landing-pages.md, docs/seo.md): its first trusted domain, the
 * production domain by convention. Pure, shared by the CMS and the public app.
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
  trustedDomains?: { domain: string }[] | null;
};

/** The tenant's canonical host, or null when it has no domain at all. */
export function tenantCanonicalHost(
  tenant: TenantHosts | null | undefined,
): string | null {
  return (
    (tenant?.trustedDomains ?? [])
      .map(({ domain }) => bareHost(domain))
      .find(Boolean) ?? null
  );
}
