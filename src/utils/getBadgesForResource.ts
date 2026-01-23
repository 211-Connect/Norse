import type { FacetWithTranslation } from '@/types/resource';
import {
  parseFilter,
  evaluateFilter,
  interpolateProperties,
} from './badgeFilterEvaluator';
import { ResourceDirectoryBadgeListItem } from '@/payload/collections/ResourceDirectories/types/badge';
import type { BadgeProps } from '@/app/(app)/shared/components/ui/badge';

export function getBadgesForResource(
  facets: FacetWithTranslation[] | null | undefined,
  badgeConfigs: ResourceDirectoryBadgeListItem[],
): BadgeProps[] {
  const badges: BadgeProps[] = [];

  if (
    !facets ||
    !badgeConfigs ||
    badgeConfigs.length === 0 ||
    !Array.isArray(facets) ||
    facets.length === 0
  ) {
    return badges;
  }

  for (const config of badgeConfigs) {
    try {
      const filterExpression = parseFilter(config.filter);

      for (const facet of facets) {
        if (evaluateFilter(filterExpression, facet)) {
          const label: string = config.badgeLabel
            ? interpolateProperties(config.badgeLabel, facet)
            : facet.termName || facet.termNameEn || facet.code;

          const tooltip: string | undefined = config.tooltip
            ? interpolateProperties(config.tooltip, facet)
            : undefined;

          badges.push({
            label,
            tooltip,
            badgeStyle: config.style,
            color: config.color,
            icon: config.icon,
          });

          break;
        }
      }
    } catch (error) {
      // Log error but don't break the entire badge generation
      console.error(`Error evaluating badge filter "${config.filter}":`, error);
    }
  }

  return badges;
}
