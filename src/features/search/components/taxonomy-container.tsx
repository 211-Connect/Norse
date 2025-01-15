import { badgeVariants } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { TaxonomyService } from '@/shared/services/taxonomy-service';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';

type TaxonomyQuery = string | string[] | TaxonomyComplexQuery;
type TaxonomyComplexQuery =
  | {
      OR?: TaxonomyComplexQuery[];
      AND?: TaxonomyComplexQuery[];
    }
  | string;

export function TaxonomyContainer() {
  const router = useRouter();
  const [taxonomies, setTaxonomies] = useState<string[]>([]);
  const { data } = useQuery({
    queryKey: ['taxonomies', ...taxonomies],
    queryFn: async () => {
      if (taxonomies.length === 0) return [];

      const data = await TaxonomyService.getTaxonomyTerms(taxonomies, {
        locale: router.locale,
      });

      return data;
    },
  });

  // Recursively extracts unique taxonomy codes from a query, handling strings, arrays, and nested 'OR'/'AND' JSON structures.
  // Limits recursion depth using the 'level' parameter.
  const extractTaxonomyCodes = useCallback(
    (query: TaxonomyQuery, level: number = 0): string[] => {
      if (level > 5) {
        console.warn('Max nesting level reached for taxonomy query', query);
        return [];
      }

      const codes = new Set<string>();
      if (typeof query === 'string') {
        query.split(',').forEach((code) => {
          codes.add(code);
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
            extractTaxonomyCodes(q, level + 1).forEach((code) =>
              codes.add(code),
            );
          });
        }
        if (query.AND) {
          query.AND.forEach((q) => {
            extractTaxonomyCodes(q, level + 1).forEach((code) =>
              codes.add(code),
            );
          });
        }
        return Array.from(codes);
      }

      return [];
    },
    [],
  );

  useEffect(() => {
    if (router.query.query_type === 'taxonomy' && router.query.query) {
      try {
        const query = router.query.query;
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
        setTaxonomies(extractedCodes);
      } catch (error) {
        console.error('Error parsing taxonomy query:', error);
        setTaxonomies([]);
      }
    } else {
      setTaxonomies([]);
    }
  }, [router.query, extractTaxonomyCodes]);

  return (
    <div className="flex flex-wrap gap-1">
      {data?.map((tax) => (
        <Link
          key={tax.code}
          className={cn(badgeVariants(), 'hover:underline')}
          href={`/search?query=${tax.code}&query_label=${tax.name}&query_type=taxonomy`}
        >
          {tax.name}
        </Link>
      ))}
    </div>
  );
}
