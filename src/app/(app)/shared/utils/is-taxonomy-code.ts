const taxonomyCodeRegexp = /^[a-zA-Z]{1,2}(-\d{1,4}([.-]\d{1,4}){0,3})?$/i;

export function isTaxonomyCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  return taxonomyCodeRegexp.test(code);
}
