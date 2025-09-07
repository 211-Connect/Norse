'use client';

import { LocalizedLink } from '@/app/shared/components/LocalizedLink';
import { badgeVariants } from '@/app/shared/components/ui/badge';
import { useClientSearchParams } from '@/app/shared/hooks/use-client-search-params';
import { cn } from '@/app/shared/lib/utils';
import { TaxonomyService } from '@/app/shared/services/taxonomy-service';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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

interface Props {
  data: TaxonomyBadgeData[] | null | undefined;
}

export function TaxonomyContainer() {
  const { i18n } = useTranslation();
  const { searchParamsObject } = useClientSearchParams();

  const [taxonomies, setTaxonomies] = useState<string[]>([]);
  const { data } = useQuery({
    queryKey: ['taxonomies', ...taxonomies],
    queryFn: async () => {
      if (taxonomies.length === 0) return [];

      const data = await TaxonomyService.getTaxonomyTerms(taxonomies, {
        locale: i18n.language,
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
    if (
      searchParamsObject.query_type === 'taxonomy' &&
      searchParamsObject.query
    ) {
      try {
        const query = searchParamsObject.query;
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
  }, [
    extractTaxonomyCodes,
    searchParamsObject.query,
    searchParamsObject.query_type,
  ]);

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
          <LocalizedLink
            key={tax.code}
            className={cn(badgeVariants(), 'hover:underline')}
            href={`/search?query=${tax.code}&query_label=${tax.name}&query_type=taxonomy`}
          >
            {tax.name}
          </LocalizedLink>
        );
      })}
    </div>
  );
}
