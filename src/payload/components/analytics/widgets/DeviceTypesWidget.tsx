'use client';

import { Banner, StaggeredShimmers } from '@payloadcms/ui';

import { PieChartWidget } from '../PieChartWidget';
import { useSessions } from '../useAnalyticsData';

const DEVICE_COLORS = ['#60a5fa', '#34d399', '#f59e0b', '#f472b6', '#a78bfa'];
const OTHER_COLOR = '#9ca3af';
const MAX_DEVICE_SEGMENTS = 5;

function toDeviceLabel(device: string): string {
  if (device === 'unknown') return 'Unknown';
  return device.charAt(0).toUpperCase() + device.slice(1);
}

export default function DeviceTypesWidget() {
  const { loading, error, data } = useSessions();

  if (loading) return <StaggeredShimmers count={1} height={220} />;

  if (error) {
    return (
      <Banner type="error">
        <strong>Could not load device types.</strong> Please contact the support
        team.
      </Banner>
    );
  }

  const sessions = data?.sessions ?? [];
  const total = sessions.length;

  if (total === 0) {
    return (
      <span style={{ color: 'var(--theme-elevation-400)', fontSize: '0.875rem' }}>
        No data
      </span>
    );
  }

  const counts = new Map<string, number>();
  for (const session of sessions) {
    const normalized = (session.device ?? '').trim().toLowerCase() || 'unknown';
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  const sortedDevices = Array.from(counts, ([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_DEVICE_SEGMENTS);

  const shownCount = sortedDevices.reduce((sum, row) => sum + row.count, 0);
  const otherCount = total - shownCount;

  const segments = sortedDevices.map((row, index) => ({
    key: row.key,
    label: toDeviceLabel(row.key),
    color: DEVICE_COLORS[index % DEVICE_COLORS.length],
    value: Math.round((row.count / total) * 100),
    rawValue: row.count,
  }));

  if (otherCount > 0) {
    segments.push({
      key: 'other',
      label: 'Other',
      color: OTHER_COLOR,
      value: Math.round((otherCount / total) * 100),
      rawValue: otherCount,
    });
  }

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
