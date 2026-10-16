import type { EventValuesResponse } from '../../../../lib/api/generated/data-contracts';
import type { PieChartWidgetSegment } from '../PieChartWidget';

/** Event + property the Blocked Bots widget reads (ISS-2366). */
export const BLOCKED_BOTS_EVENT = 'bot_blocked';
export const BLOCKED_BOTS_PROPERTY = 'segment';

export const BLOCKED_BOTS_CLASSIFICATIONS: {
  key: string;
  label: string;
  color: string;
}[] = [
  { key: 'nefarious', label: 'Nefarious', color: '#f472b6' },
  { key: 'seo', label: 'SEO', color: '#60a5fa' },
  { key: 'unknown', label: 'Unknown', color: '#9ca3af' },
];
const OTHER_COLOR = '#a78bfa';

/** Observe-only denials (`enforced: false`): detected, but the request was served. */
export const NOT_ENFORCED_SEGMENT = {
  key: 'not_enforced',
  label: 'Detected, not blocked',
  color: '#fbbf24',
};

export function buildBlockedBotsSegments(values: EventValuesResponse[]): {
  /** Every `bot_blocked` event in the period, blocked or not. */
  total: number;
  /** Requests that actually got the 403. */
  blocked: number;
  /** Observe-only denials: detected, but served. */
  notEnforced: number;
  segments: PieChartWidgetSegment[];
} {
  const total = values.reduce((sum, entry) => sum + entry.total, 0);
  if (total === 0) return { total, blocked: 0, notEnforced: 0, segments: [] };

  const counts = new Map<string, number>();
  for (const entry of values) {
    const key = entry.value.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + entry.total);
  }

  const segments: PieChartWidgetSegment[] = BLOCKED_BOTS_CLASSIFICATIONS.map(
    (c) => {
      const count = counts.get(c.key) ?? 0;
      counts.delete(c.key);
      return {
        key: c.key,
        label: c.label,
        color: c.color,
        value: Math.round((count / total) * 100),
        rawValue: count,
      };
    },
  );

  const notEnforced = counts.get(NOT_ENFORCED_SEGMENT.key) ?? 0;
  counts.delete(NOT_ENFORCED_SEGMENT.key);
  if (notEnforced > 0) {
    segments.push({
      ...NOT_ENFORCED_SEGMENT,
      value: Math.round((notEnforced / total) * 100),
      rawValue: notEnforced,
    });
  }

  const otherCount = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  if (otherCount > 0) {
    segments.push({
      key: 'other',
      label: 'Other',
      color: OTHER_COLOR,
      value: Math.round((otherCount / total) * 100),
      rawValue: otherCount,
    });
  }

  return { total, blocked: total - notEnforced, notEnforced, segments };
}
