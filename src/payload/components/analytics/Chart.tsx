'use client';

import { StaggeredShimmers } from '@payloadcms/ui';
import { memo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { WidgetCard } from './WidgetCard';
import { WidgetErrorState } from './WidgetErrorState';

export interface LineChartDataPoint {
  [key: string]: string | number;
}

interface ChartProps {
  title: string;
  xAxisKey?: string;
  data: LineChartDataPoint[];
  color?: string;
  description?: string;
  onRefresh: () => void;
  refreshing?: boolean;
  loading?: boolean;
  errorTitle?: string;
  errorDescription?: string;
}

const CHART_MARGIN = { top: 5, right: 20, left: 0, bottom: 5 };
const TICK_STYLE = { fontSize: 12 };
const LINE_ACTIVE_DOT = { r: 4 };

export const Chart = memo(function Chart({
  title,
  xAxisKey = 'date',
  data,
  color = '#4f46e5',
  description,
  onRefresh,
  refreshing,
  loading = false,
  errorTitle,
  errorDescription,
}: ChartProps) {
  if (errorTitle) {
    return (
      <WidgetErrorState
        title={errorTitle}
        description={errorDescription}
        onRetry={onRefresh}
        retrying={refreshing}
      />
    );
  }

  return (
    <WidgetCard
      title={title}
      description={description}
      headingLevel="h3"
      height="100%"
    >
      {loading ? (
        <StaggeredShimmers count={1} height={340} />
      ) : (
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
      )}
    </WidgetCard>
  );
});
