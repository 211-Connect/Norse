import type { BlockedTrafficResponse } from '../../../../lib/api/generated/data-contracts';
import type { PieChartWidgetSegment } from '../PieChartWidget';

export const BLOCKED_BOTS_CLASSIFICATIONS: {
  key: BlockedTrafficResponse['byClassification'][number]['classification'];
  label: string;
  color: string;
}[] = [
  { key: 'nefarious', label: 'Nefarious', color: '#f472b6' },
  { key: 'seo', label: 'SEO', color: '#60a5fa' },
  { key: 'unknown', label: 'Unknown', color: '#9ca3af' },
];

/** Observe-only denials: detected, but the request was served. */
export const NOT_ENFORCED_SEGMENT = {
  key: 'not_enforced',
  label: 'Detected, not blocked',
  color: '#fbbf24',
};

/**
 * Pie segments for the Blocked Bots widget: blocked requests by
 * classification, plus one slice for observe-only denials. Percentages are
 * of everything detected; `rawValue` is the count.
 */
export function buildBlockedBotsSegments(
  data: Pick<
    BlockedTrafficResponse,
    'blocked' | 'notEnforced' | 'byClassification'
  >,
): {
  /** Everything detected in the period, blocked or not. */
  total: number;
  segments: PieChartWidgetSegment[];
} {
  const total = data.blocked + data.notEnforced;
  if (total === 0) return { total, segments: [] };

  const percent = (count: number) => Math.round((count / total) * 100);

  const segments: PieChartWidgetSegment[] = BLOCKED_BOTS_CLASSIFICATIONS.map(
    (c) => {
      const count =
        data.byClassification.find((entry) => entry.classification === c.key)
          ?.blocked ?? 0;
      return { ...c, value: percent(count), rawValue: count };
    },
  );

  if (data.notEnforced > 0) {
    segments.push({
      ...NOT_ENFORCED_SEGMENT,
      value: percent(data.notEnforced),
      rawValue: data.notEnforced,
    });
  }

  return { total, segments };
}
