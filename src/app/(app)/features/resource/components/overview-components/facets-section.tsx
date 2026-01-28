'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SquareCheck } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/(app)/shared/components/ui/card';
import { Resource, FacetWithTranslation } from '@/types/resource';

const EXCLUDED_TAXONOMY_NAMES = [
  'Area Served by County',
  'Days Of The Week',
  'Call Centers',
];

interface GroupedFacets {
  [taxonomyName: string]: FacetWithTranslation[];
}

export function FacetsSection({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');

  const filteredFacets = useMemo(() => {
    const { facets } = resource ?? {};

    if (!facets || facets.length === 0) {
      return null;
    }

    const filtered = facets.filter(
      (facet) =>
        !EXCLUDED_TAXONOMY_NAMES.includes(
          facet.taxonomyNameEn ?? facet.taxonomyName,
        ),
    );

    if (filtered.length === 0) {
      return null;
    }

    const grouped = filtered.reduce<GroupedFacets>((acc, facet) => {
      if (!acc[facet.taxonomyName]) {
        acc[facet.taxonomyName] = [];
      }
      acc[facet.taxonomyName].push(facet);
      return acc;
    }, {});

    return grouped;
  }, [resource]);

  if (!filteredFacets) {
    return null;
  }

  return (
    <Card className="print:border-none print:shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{t('other_information')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {Object.entries(filteredFacets).map(([taxonomyName, facets]) => (
            <div key={taxonomyName} className="flex flex-col gap-2">
              <p className="text-sm font-semibold">{taxonomyName}</p>
              <div className="flex flex-col gap-2">
                {facets.map((facet, index) => (
                  <div
                    key={`${facet.code}-${index}`}
                    className="flex items-start gap-2"
                  >
                    <SquareCheck className="mt-0.5 size-4 shrink-0 text-[#bbbbbb]" />
                    <span className="text-sm">{facet.termName}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
