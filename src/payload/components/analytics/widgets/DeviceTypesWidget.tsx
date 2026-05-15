'use client';

import { PieChartWidgetSegment } from '../PieChartWidget';
import { UmamiSession } from '../types';
import { SessionsPieWidget } from './SessionsPieWidget';

const DEVICE_COLORS = ['#60a5fa', '#34d399', '#f59e0b', '#f472b6', '#a78bfa'];
const OTHER_COLOR = '#9ca3af';
const MAX_DEVICE_SEGMENTS = 5;

function toDeviceLabel(device: string): string {
  if (device === 'unknown') return 'Unknown';
  return device.charAt(0).toUpperCase() + device.slice(1);
}

export default function DeviceTypesWidget() {
  const buildSegments = (sessions: UmamiSession[]): PieChartWidgetSegment[] => {
    const total = sessions.length;

    const counts = new Map<string, number>();
    for (const session of sessions) {
      const normalized =
        (session.device ?? '').trim().toLowerCase() || 'unknown';
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

    return segments;
  };

  return (
    <SessionsPieWidget
      buildSegments={buildSegments}
      errorTitle="Could not load device types."
      errorDescription="Please contact the support team."
    />
  );
}
