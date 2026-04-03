'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface LineChartDataPoint {
  [key: string]: string | number;
}

interface ChartProps {
  title: string;
  xAxisKey?: string;
  data: LineChartDataPoint[];
  color?: string;
}

const CHART_MARGIN = { top: 5, right: 20, left: 0, bottom: 5 };
const TICK_STYLE = { fontSize: 12 };
const LINE_ACTIVE_DOT = { r: 4 };

export const Chart = React.memo(function Chart({
  title,
  xAxisKey = 'date',
  data,
  color = '#4f46e5',
}: ChartProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ margin: '0 0 0.5rem 0' }}>{title}</h3>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 1, height: 1 }}
        >
          <LineChart data={data} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xAxisKey} tick={TICK_STYLE} />
            <YAxis tick={TICK_STYLE} />
            <Tooltip />
            <Line
              type="linear"
              dataKey={title}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={LINE_ACTIVE_DOT}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
