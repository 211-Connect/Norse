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
import { AppConfig } from '@/types/appConfig';

const EXCLUDED_TAXONOMY_NAMES = [
  'Area Served by County',
  'Days Of The Week',
  'Call Centers',
];

interface GroupedFacets {
  [taxonomyName: string]: FacetWithTranslation[];
}

export function FacetsSection({
  resource,
  facetsConfig,
}: {
  resource: Resource;
  facetsConfig: AppConfig['search']['facets'];
}) {
  const { t } = useTranslation('page-resource');

  const filteredFacets = useMemo(() => {
    const { facets } = resource ?? {};

    if (!facets || facets.length === 0) {
      return null;
    }

    const taxonomyVisibilityMap = new Map(
      facetsConfig.map((config) => [
        config.name,
        config.showInDetails !== false,
      ]),
    );

    const filtered = facets.filter((facet) => {
      const taxonomyName = facet.taxonomyNameEn ?? facet.taxonomyName;

      if (EXCLUDED_TAXONOMY_NAMES.includes(taxonomyName)) {
        return false;
      }

      if (
        taxonomyVisibilityMap.has(facet.taxonomyName) &&
        !taxonomyVisibilityMap.get(facet.taxonomyName)
      ) {
        return false;
      }

      return true;
    });

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

    const deduplicated = Object.entries(grouped).reduce<GroupedFacets>(
      (acc, [taxonomyName, facets]) => {
        const seen = new Set<string>();
        acc[taxonomyName] = facets.filter((facet) => {
          if (seen.has(facet.termName)) {
            return false;
          }
          seen.add(facet.termName);
          return true;
        });
        return acc;
      },
      {},
    );

    return deduplicated;
  }, [resource, facetsConfig]);

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
