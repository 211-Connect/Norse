import type { FacetWithTranslation, Taxonomy } from '@/types/resource';
import {
  parseFilter,
  evaluateFilter,
  interpolateProperties,
} from './badgeFilterEvaluator';
import { ResourceDirectoryBadgeListItem } from '@/payload/collections/ResourceDirectories/types/badge';
import type { BadgeProps } from '@/app/(app)/shared/components/ui/badge';
import { createLogger } from '@/lib/logger';

const log = createLogger('getBadgesForResource');

/**
 * Convert taxonomies to FacetWithTranslation format for badge matching
 */
function taxonomiesToFacets(
  taxonomies: Taxonomy[] | null | undefined,
): FacetWithTranslation[] {
  if (!taxonomies || !Array.isArray(taxonomies)) {
    return [];
  }

  return taxonomies.map((taxonomy) => ({
    code: taxonomy.code,
    taxonomyCode: taxonomy.code,
    taxonomyName: taxonomy.name,
    taxonomyNameEn: taxonomy.name,
    termName: taxonomy.name,
    termNameEn: taxonomy.name,
  }));
}

export function getBadgesForResource(
  badgeConfigs: ResourceDirectoryBadgeListItem[],
  facets: FacetWithTranslation[] | null | undefined,
  taxonomies: Taxonomy[] | null,
): BadgeProps[] {
  const badges: BadgeProps[] = [];
  const seenLabels = new Set<string>();

  const taxonomyFacets = taxonomiesToFacets(taxonomies);
  const allFacets = [
    ...(Array.isArray(facets) ? facets : []),
    ...taxonomyFacets,
  ];

  if (!badgeConfigs || badgeConfigs.length === 0 || allFacets.length === 0) {
    return badges;
  }

  for (const config of badgeConfigs) {
    try {
      const filterExpression = parseFilter(config.filter);

      for (const facet of allFacets) {
        if (evaluateFilter(filterExpression, facet)) {
          const label: string = config.badgeLabel
            ? interpolateProperties(config.badgeLabel, facet)
            : facet.termName || facet.termNameEn || facet.code;

          // Skip if badge with same label already exists
          if (seenLabels.has(label)) {
            continue;
          }

          const tooltip: string | undefined = config.tooltip
            ? interpolateProperties(config.tooltip, facet)
            : undefined;

          seenLabels.add(label);
          badges.push({
            label,
            tooltip,
            badgeStyle: config.style,
            color: config.color,
            icon: config.icon,
          });
        }
      }
    } catch (error) {
      // Log error but don't break the entire badge generation
      log.error(
        { err: error, filter: config.filter },
        'Error evaluating badge filter',
      );
    }
  }

  return badges;
}
