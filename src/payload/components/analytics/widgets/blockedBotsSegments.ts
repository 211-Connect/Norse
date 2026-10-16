import type { EventValuesResponse } from '../../../../lib/api/generated/data-contracts';
import type { PieChartWidgetSegment } from '../PieChartWidget';

/** Event + property the Blocked Bots widget reads (ISS-2366). */
export const BLOCKED_BOTS_EVENT = 'bot_blocked';
export const BLOCKED_BOTS_PROPERTY = 'classification';

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

export function buildBlockedBotsSegments(values: EventValuesResponse[]): {
  total: number;
  segments: PieChartWidgetSegment[];
} {
  const total = values.reduce((sum, entry) => sum + entry.total, 0);
  if (total === 0) return { total, segments: [] };

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

  return { total, segments };
}
