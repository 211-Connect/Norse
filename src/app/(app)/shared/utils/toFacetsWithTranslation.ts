import { FacetWithTranslation } from '@/types/resource';
import { DocumentFacets, SearchFacets } from '@/types/search';

export function transformFacetsToArray(
  sourceFacets: DocumentFacets | null | undefined,
  facetDefinitions: SearchFacets | null | undefined,
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
        if (taxDef) {
          taxonomyNameEn = taxDef.en;
          taxonomyName = taxDef[locale] || taxDef.en;
        }
      }

      let currentLocaleTerms: string[] = [];
      let englishTerms: string[] = [];

      // DocumentFacets is Record<string, Record<string, string[]>>
      // terms is Record<string, string[]>
      if (terms && typeof terms === 'object' && !Array.isArray(terms)) {
        currentLocaleTerms = terms[locale] || [];
        englishTerms = terms['en'] || [];
      } else if (Array.isArray(terms)) {
        // Fallback for legacy structure if any
        currentLocaleTerms = terms;
        englishTerms = terms;
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
