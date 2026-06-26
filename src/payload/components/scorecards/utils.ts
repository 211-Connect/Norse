import {
  NeedWeights,
  TaxonomyScorecardVersion,
} from '@/types/taxonomyScorecard';
import { NEED_DEFINITIONS } from './constants';

export function buildInitialWeights(
  weights: NeedWeights | undefined,
): Record<string, string> {
  const state: Record<string, string> = {};

  for (const need of NEED_DEFINITIONS) {
    const value = weights?.[need.code];
    state[need.code] =
      typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
  }

  return state;
}

export function sortVersions(
  versions: Record<string, TaxonomyScorecardVersion> | undefined,
): TaxonomyScorecardVersion[] {
  if (!versions) {
    return [];
  }

  const getVersionRank = (versionId: string): number => {
    const normalized = String(versionId).trim().toLowerCase();

    if (!normalized || normalized === '0' || normalized === 'default') {
      return 0;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
  };

  return Object.values(versions).sort((a, b) => {
    const rankA = getVersionRank(a.version_id);
    const rankB = getVersionRank(b.version_id);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    return String(a.version_id).localeCompare(String(b.version_id));
  });
}
