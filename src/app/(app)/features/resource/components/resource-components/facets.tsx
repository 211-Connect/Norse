'use client';

import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { AppConfig } from '@/types/appConfig';
import { FacetWithTranslation, Resource } from '@/types/resource';
import { SquareCheck } from 'lucide-react';
import { cache, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const EXCLUDED_TAXONOMY_NAMES = [
  'Area Served by County',
  'Days Of The Week',
  'Call Centers',
];

interface GroupedFacets {
  [taxonomyName: string]: FacetWithTranslation[];
}
const getFacetsOrig = (
  resource: Resource,
  facetsConfig: AppConfig['search']['facets'],
): GroupedFacets | null => {
  const { facets } = resource ?? {};

  if (!facets || facets.length === 0) {
    return null;
  }

  const taxonomyVisibilityMap = new Map(
    facetsConfig.map((config) => [config.name, config.showInDetails !== false]),
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
};

export const getFacets = cache(getFacetsOrig);

export function FacetsComponent({ resource }: { resource: Resource }) {
  const appConfig = useAppConfig();
  const facetsConfig = appConfig.search.facets;
  const { t } = useTranslation('page-resource');

  const filteredFacets = useMemo(
    () => getFacets(resource, facetsConfig),
    [resource, facetsConfig],
  );

  if (!filteredFacets) {
    return null;
  }

  return (
    <div>
      <Typography variant="heading" size="sm" className="mb-4">
        {t('other_information')}
      </Typography>
      <div className="flex flex-col gap-6">
        {Object.entries(filteredFacets).map(([taxonomyName, facets]) => (
          <div key={taxonomyName} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{taxonomyName}</h3>
            <ul className="flex flex-col gap-2">
              {facets.map((facet, index) => (
                <li
                  key={`${facet.code}-${index}`}
                  className="flex items-start gap-2"
                >
                  <SquareCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="text-sm">{facet.termName}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
