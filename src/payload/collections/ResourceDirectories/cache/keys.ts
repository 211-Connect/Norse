export function createCacheKey(locale: string, host: string): string {
  return `resourceDirectoryByHost:${host}:${locale}`;
}

export function createCacheKeyForAllLocales(host: string): string {
  return `resourceDirectoryByHost:${host}:*`;
}
