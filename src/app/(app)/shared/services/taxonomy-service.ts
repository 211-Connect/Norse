export function isTaxonomyCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  return this.taxonomyCodeRegexp.test(code);
}
