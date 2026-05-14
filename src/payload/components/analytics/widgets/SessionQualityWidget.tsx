'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

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
  let sessionQuality: SessionQuality | null = null;
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
  sessionQuality = {
    short: Math.round((short / total) * 100),
    balanced: Math.round((balanced / total) * 100),
    meaningful: Math.round((meaningful / total) * 100),
  };

  const chartData = sessionQuality
    ? SEGMENTS.map(({ key, label }) => ({
        name: label,
        value: sessionQuality[key],
      }))
    : [];

  return (
    <div>
      {sessionQuality === null ? (
        <span
          style={{ color: 'var(--theme-elevation-400)', fontSize: '0.875rem' }}
        >
          No data
        </span>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                dataKey="value"
                paddingAngle={2}
              >
                {SEGMENTS.map(({ key, color }) => (
                  <Cell key={key} fill={color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}%`]}
                contentStyle={{
                  background: 'var(--theme-elevation-50)',
                  border: '1px solid var(--theme-elevation-150)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              gap: '1.25rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {SEGMENTS.map(({ key, label, color }) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <div
                  style={{
                    width: '0.625rem',
                    height: '0.625rem',
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--theme-elevation-500)',
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--theme-text)',
                  }}
                >
                  {sessionQuality[key]}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
