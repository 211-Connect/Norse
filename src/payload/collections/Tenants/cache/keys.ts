export function createCacheKey(host: string): string {
  return `tenantByHost:${host}`;
}
