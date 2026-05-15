'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export type PieChartWidgetSegment = {
  key: string;
  label: string;
  color: string;
  value: number;
  rawValue?: number;
};

type PieChartWidgetProps = {
  segments: PieChartWidgetSegment[];
  height?: number;
  formatValue?: (segment: PieChartWidgetSegment) => string;
  formatTooltip?: (segment: PieChartWidgetSegment) => string;
};

const TOOLTIP_STYLE = {
  background: 'var(--theme-elevation-50)',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
};

const LEGEND_CONTAINER_STYLE = {
  display: 'flex',
  gap: '1.25rem',
  flexWrap: 'wrap' as const,
  justifyContent: 'center',
};

const LEGEND_ITEM_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
};

const LEGEND_DOT_STYLE = {
  width: '0.625rem',
  height: '0.625rem',
  borderRadius: '50%',
  flexShrink: 0,
};

const LEGEND_LABEL_STYLE = {
  fontSize: '0.875rem',
  color: 'var(--theme-elevation-500)',
};

const LEGEND_VALUE_STYLE = {
  fontSize: '0.875rem',
  fontWeight: 700,
  color: 'var(--theme-text)',
};

function defaultFormatValue(segment: PieChartWidgetSegment): string {
  return `${segment.value}%`;
}

function defaultFormatTooltip(segment: PieChartWidgetSegment): string {
  const count = segment.rawValue ?? segment.value;
  return `${segment.label} ${segment.value}% (${count.toLocaleString()})`;
}

export function PieChartWidget({
  segments,
  height = 180,
  formatValue = defaultFormatValue,
  formatTooltip = defaultFormatTooltip,
}: PieChartWidgetProps) {
  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={segments}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            dataKey="value"
            paddingAngle={2}
          >
            {segments.map((segment) => (
              <Cell key={segment.key} fill={segment.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(_, __, payload) => {
              const segment = payload?.payload as
                | PieChartWidgetSegment
                | undefined;
              return segment ? [formatTooltip(segment)] : [''];
            }}
            contentStyle={TOOLTIP_STYLE}
          />
        </PieChart>
      </ResponsiveContainer>

      <div style={LEGEND_CONTAINER_STYLE}>
        {segments.map((segment) => (
          <div key={segment.key} style={LEGEND_ITEM_STYLE}>
            <div
              style={{
                ...LEGEND_DOT_STYLE,
                background: segment.color,
              }}
            />
            <span style={LEGEND_LABEL_STYLE}>{segment.label}</span>
            <span style={LEGEND_VALUE_STYLE}>{formatValue(segment)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
