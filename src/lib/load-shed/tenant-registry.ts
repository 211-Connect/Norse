/**
 * Host → tenant, shared by everything in the server process (the proxy,
 * pages and the HTTP-level load-limit hook) through globalThis. The hook
 * runs before Next.js sees a request, so it only knows the host; the proxy
 * and the app config fill this in as they resolve tenants.
 */

export interface LoadShedTenant {
  tenantId?: string;
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
}

/** Hosts are only added once resolved to a tenant; this is a safety cap. */
export const LOAD_SHED_REGISTRY_MAX_HOSTS = 2000;

const REGISTRY_KEY = Symbol.for('norse.loadShed.tenants');

type GlobalWithRegistry = typeof globalThis & {
  [REGISTRY_KEY]?: Map<string, LoadShedTenant>;
};

function registry(): Map<string, LoadShedTenant> {
  const store = globalThis as GlobalWithRegistry;
  store[REGISTRY_KEY] ??= new Map();
  return store[REGISTRY_KEY];
}

/** Merge what is known about `host`'s tenant. Never throws. */
export function rememberTenant(host: string, info: LoadShedTenant): void {
  try {
    if (!host) return;
    const map = registry();
    const existing = map.get(host);
    if (!existing && map.size >= LOAD_SHED_REGISTRY_MAX_HOSTS) return;

    const defined = Object.fromEntries(
      Object.entries(info).filter(
        ([, value]) => value !== undefined && value !== '',
      ),
    ) as LoadShedTenant;
    map.set(host, { ...existing, ...defined });
  } catch {
    // Never break a request over this cache.
  }
}

export function tenantForHost(host: string): LoadShedTenant | undefined {
  return registry().get(host);
}

/** Tests only. */
export function clearTenantRegistry(): void {
  registry().clear();
}
