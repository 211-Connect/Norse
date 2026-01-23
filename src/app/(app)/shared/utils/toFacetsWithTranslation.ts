import { FacetWithTranslation } from '@/types/resource';

export function transformFacetsToArray(
  sourceFacets: unknown, // expected { [taxonomyCode: string]: string[] }
  facetDefinitions: unknown, // expected { [taxonomyCode: string]: { en: string; [locale: string]: string } }
  locale: string,
): FacetWithTranslation[] {
  if (!sourceFacets || typeof sourceFacets !== 'object') {
    return [];
  }

  const result: FacetWithTranslation[] = [];

  try {
    for (const [taxonomyCode, terms] of Object.entries(sourceFacets)) {
      let taxonomyNameEn: string | undefined;
      let taxonomyName: string | undefined;

      if (facetDefinitions && typeof facetDefinitions === 'object') {
        const taxDef = facetDefinitions[taxonomyCode];
        if (taxDef && typeof taxDef === 'object') {
          taxonomyNameEn = taxDef.en;
          taxonomyName = taxDef[locale] || taxDef.en;
        } else if (typeof taxDef === 'string') {
          taxonomyNameEn = taxDef;
          taxonomyName = taxDef;
        }
      }

      let currentLocaleTerms: string[] = [];
      let englishTerms: string[] = [];

      if (Array.isArray(terms)) {
        currentLocaleTerms = terms;
        englishTerms = terms;
      } else if (terms && typeof terms === 'object') {
        const termsObj: Record<string, unknown> = terms;
        currentLocaleTerms = Array.isArray(termsObj[locale])
          ? termsObj[locale]
          : [];
        englishTerms = Array.isArray(termsObj.en) ? termsObj.en : [];
      }

      const maxLength = Math.max(
        currentLocaleTerms.length,
        englishTerms.length,
      );

      for (let i = 0; i < maxLength; i++) {
        const termName = currentLocaleTerms[i] || englishTerms[i] || '';
        const termNameEn = englishTerms[i] || currentLocaleTerms[i] || '';

        if (termName || termNameEn) {
          result.push({
            code: termNameEn,
            taxonomyName: taxonomyName || taxonomyNameEn || taxonomyCode,
            taxonomyNameEn: taxonomyNameEn || taxonomyName || taxonomyCode,
            termName: termName,
            termNameEn: termNameEn,
            taxonomyCode,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error transforming facets in search-service:', error);
    return [];
  }

  return result;
}
