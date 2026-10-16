'use client';

import { PieChartWidget } from '../PieChartWidget';
import { useAnalyticsEventValues } from '../useAnalyticsData';
import { WidgetCard } from '../WidgetCard';
import { WidgetErrorState } from '../WidgetErrorState';
import { WidgetSkeleton } from '../WidgetSkeleton';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';
import {
  BLOCKED_BOTS_EVENT,
  BLOCKED_BOTS_PROPERTY,
  buildBlockedBotsSegments,
} from './blockedBotsSegments';

/**
 * ISS-2366: requests Arcjet blocked at the proxy, by classification. Reads
 * the server-side `bot_blocked` event (src/lib/blocked-traffic-events.ts)
 * broken down by its `classification` property. These requests never load
 * the page, so they are not in Page Views.
 */
export default function BlockedBotsWidget() {
  const { loading, error, data, refetch } = useAnalyticsEventValues(
    BLOCKED_BOTS_EVENT,
    BLOCKED_BOTS_PROPERTY,
  );

  if (loading && !data) {
    return <WidgetSkeleton height={220} count={1} shimmerHeight={180} />;
  }

  if (error) {
    return (
      <WidgetErrorState
        title="Could not load blocked bots."
        description="Please contact the support team."
        onRetry={refetch}
        retrying={loading}
      />
    );
  }

  const { total, segments } = buildBlockedBotsSegments(data ?? []);

  return (
    <WidgetCard
      title="Blocked Bots"
      description={WIDGET_INFO[WidgetSlug.BlockedBots]}
    >
      <span
        style={{
          fontSize: '2.25rem',
          fontWeight: 700,
          lineHeight: 1,
          color: 'var(--theme-text)',
        }}
      >
        {total.toLocaleString()}
      </span>
      {total === 0 ? (
        <div
          style={{
            height: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--theme-elevation-500)',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          No blocked requests in the selected period.
        </div>
      ) : (
        <PieChartWidget
          segments={segments}
          formatValue={(segment) =>
            (segment.rawValue ?? segment.value).toLocaleString()
          }
          formatTooltip={(segment) =>
            `${segment.label}: ${(segment.rawValue ?? segment.value).toLocaleString()} (${segment.value}%)`
          }
        />
      )}
    </WidgetCard>
  );
}
