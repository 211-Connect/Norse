'use client';

import { PieChartWidget } from '../PieChartWidget';
import { useAnalyticsBlockedTraffic } from '../useAnalyticsData';
import { WidgetCard } from '../WidgetCard';
import { WidgetErrorState } from '../WidgetErrorState';
import { WidgetSkeleton } from '../WidgetSkeleton';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';
import { buildBlockedBotsSegments } from './blockedBotsSegments';

/**
 * ISS-2366: requests Arcjet bot protection denied, by classification. Reads
 * Norse-API's hourly counters (`/analytics/blocked-traffic`), not Umami:
 * these requests never load the page. Observe-only hosts are a separate
 * "detected, not blocked" slice; the headline counts only the blocked ones.
 */
export default function BlockedBotsWidget() {
  const { loading, error, data, refetch } = useAnalyticsBlockedTraffic();

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

  const blocked = data?.blocked ?? 0;
  const notEnforced = data?.notEnforced ?? 0;
  const { total, segments } = buildBlockedBotsSegments({
    blocked,
    notEnforced,
    byClassification: data?.byClassification ?? [],
  });

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
        {blocked.toLocaleString()}
      </span>
      {notEnforced > 0 && (
        <div
          style={{
            fontSize: '0.875rem',
            color: 'var(--theme-elevation-500)',
          }}
        >
          + {notEnforced.toLocaleString()} detected, not blocked
        </div>
      )}
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
