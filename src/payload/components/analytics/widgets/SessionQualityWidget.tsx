'use client';

import { PieChartWidget } from '../PieChartWidget';
import { useSessions } from '../useAnalyticsData';

export interface SessionQuality {
  short: number;
  balanced: number;
  meaningful: number;
}

const SEGMENTS: { key: keyof SessionQuality; label: string; color: string }[] =
  [
    { key: 'short', label: 'Short', color: '#f87171' },
    { key: 'balanced', label: 'Balanced', color: '#facc15' },
    { key: 'meaningful', label: 'Meaningful', color: '#4ade80' },
  ];

const DURATION_THRESHOLDS = {
  short: 1 * 60 * 1000, // less than 1 minute
  balanced: 5 * 60 * 1000, // between 1 and 5 minutes
};

export default function SessionQualityWidget() {
  const sessionsData = useSessions();
  const sessions = sessionsData?.data?.sessions ?? [];
  let short = 0;
  let balanced = 0;
  let meaningful = 0;
  for (const session of sessions) {
    const duration =
      new Date(session.lastAt).getTime() - new Date(session.firstAt).getTime();
    if (duration < DURATION_THRESHOLDS.short) short++;
    else if (duration <= DURATION_THRESHOLDS.balanced) balanced++;
    else meaningful++;
  }
  const total = sessions.length;

  if (total === 0) {
    return (
      <span style={{ color: 'var(--theme-elevation-400)', fontSize: '0.875rem' }}>
        No data
      </span>
    );
  }

  const sessionQuality: SessionQuality = {
    short: Math.round((short / total) * 100),
    balanced: Math.round((balanced / total) * 100),
    meaningful: Math.round((meaningful / total) * 100),
  };

  const segmentCounts: SessionQuality = {
    short,
    balanced,
    meaningful,
  };

  const segments = SEGMENTS.map(({ key, label, color }) => ({
    key,
    label,
    color,
    value: sessionQuality[key],
    rawValue: segmentCounts[key],
  }));

  return (
    <PieChartWidget
      segments={segments}
      formatValue={(segment) =>
        `${segment.value}% (${(segment.rawValue ?? 0).toLocaleString()})`
      }
      formatTooltip={(segment) =>
        `${segment.label}: ${segment.value}% (${(segment.rawValue ?? 0).toLocaleString()})`
      }
    />
  );
}
