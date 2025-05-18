import { fetchTaxonomyTerms } from '@/lib/server/fetch-taxonomy-terms';
import { badgeVariants } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import Link from 'next/link';

type TaxonomyQuery = string | string[] | TaxonomyComplexQuery;
type TaxonomyComplexQuery =
  | {
      OR?: TaxonomyComplexQuery[];
      AND?: TaxonomyComplexQuery[];
    }
  | string;

interface TaxonomyBadgeData {
  code: string | null | undefined;
  name: string | null | undefined;
}

// Recursively extracts unique taxonomy codes from a query, handling strings, arrays, and nested 'OR'/'AND' JSON structures.
// Limits recursion depth using the 'level' parameter.
const extractTaxonomyCodes = (
  query: TaxonomyQuery,
  level: number = 0,
): string[] => {
  if (level > 5) {
    console.warn('Max nesting level reached for taxonomy query', query);
    return [];
  }

  const codes = new Set<string>();
  if (typeof query === 'string') {
    query.split(',').forEach((code) => {
      codes.add(code.trim());
    });
    return Array.from(codes);
  }

  if (Array.isArray(query)) {
    query.forEach((q) => {
      extractTaxonomyCodes(q, level + 1).forEach((code) => codes.add(code));
    });
    return Array.from(codes);
  }
  if (query && typeof query === 'object') {
    if (query.OR) {
      query.OR.forEach((q) => {
        extractTaxonomyCodes(q, level + 1).forEach((code) => codes.add(code));
      });
    }
    if (query.AND) {
      query.AND.forEach((q) => {
        extractTaxonomyCodes(q, level + 1).forEach((code) => codes.add(code));
      });
    }
    return Array.from(codes);
  }

  return [];
};

const getTaxonomies = (
  query: string | undefined,
  queryType: string | undefined,
) => {
  if (queryType === 'taxonomy' && query) {
    try {
      let parsedQuery: TaxonomyQuery;
      if (
        typeof query === 'string' &&
        (query.startsWith('[') || query.startsWith('{'))
      ) {
        parsedQuery = JSON.parse(query);
      } else {
        parsedQuery = query as string;
      }
      const extractedCodes = extractTaxonomyCodes(parsedQuery);
      return extractedCodes;
    } catch (error) {
      console.error('Error parsing taxonomy query:', error);
      return [];
    }
  } else {
    return [];
  }
};

export async function TaxonomyContainer({
  query,
  queryType,
}: {
  query: string | undefined;
  queryType: string | undefined;
}) {
  const terms = getTaxonomies(query, queryType);

  const { data } = await fetchTaxonomyTerms(terms);

  // Deduplicate data based on code
  const uniqueTaxonomies = data?.reduce<TaxonomyBadgeData[]>((acc, tax) => {
    if (!tax || !tax.code || !tax.name) {
      return acc; // Skip invalid entries
    }
    if (!acc.find((t) => t.code === tax.code)) {
      acc.push(tax);
    }
    return acc;
  }, []);

  return (
    <div className="flex flex-wrap gap-1">
      {uniqueTaxonomies?.map((tax) => {
        if (!tax || !tax.name || !tax.code) {
          return null;
        }

        return (
          <Link
            key={tax.code}
            className={cn(badgeVariants(), 'hover:underline')}
            href={`/search?query=${tax.code}&query_label=${tax.name}&query_type=taxonomy`}
          >
            {tax.name}
          </Link>
        );
      })}
    </div>
  );
}
