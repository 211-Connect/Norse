'use client';

import { usePreferences } from '@payloadcms/ui';
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { PREFERENCE_KEYS } from 'payload/shared';
import {
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  EventCatalogEntryResponse,
  EventValuesResponse,
} from '../../../../lib/api/generated/data-contracts';
import CompactSelectField from '../CompactSelectField';
import { PieChartWidget, PieChartWidgetSegment } from '../PieChartWidget';
import { useAnalyticsEventCatalog, useAnalyticsEventValues } from '../useAnalyticsData';
import { useWidgetId } from '../useWidgetId';
import { WidgetErrorState } from '../WidgetErrorState';
import { WidgetSkeleton } from '../WidgetSkeleton';

const SEGMENT_COLORS = [
  '#60a5fa',
  '#34d399',
  '#f59e0b',
  '#f472b6',
  '#a78bfa',
  '#22d3ee',
];
const OTHER_COLOR = '#9ca3af';
const MAX_SEGMENTS = 6;

type EventCardWidgetData = {
  event?: string;
  property?: string;
};

type EventCardWidgetClientProps = {
  widgetData?: EventCardWidgetData;
};

type LayoutItem = {
  id: string;
  data?: Record<string, unknown>;
};

export default function EventCardWidgetClient({
  widgetData,
}: EventCardWidgetClientProps) {
  const { selectedTenantID } = useTenantSelection();
  const rootRef = useRef<HTMLDivElement>(null);
  const widgetId = useWidgetId(rootRef);
  const { getPreference, setPreference } = usePreferences();

  const [event, setEvent] = useState<string | null>(widgetData?.event ?? null);
  const [property, setProperty] = useState<string | null>(
    widgetData?.property ?? null,
  );
  const [isEditing, setIsEditing] = useState(!widgetData?.event);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const catalog = useAnalyticsEventCatalog(
    selectedTenantID ? String(selectedTenantID) : undefined,
  );
  const eventDataValues = useAnalyticsEventValues(event ?? '', property ?? '');

  const contentLoading =
    event && property ? eventDataValues.loading : false;
  const contentError = event && property ? eventDataValues.error : null;

  useEffect(() => {
    setEvent(widgetData?.event ?? null);
    setProperty(widgetData?.property ?? null);
    setIsEditing(!widgetData?.event);
    setDirty(false);
  }, [widgetData]);

  const catalogByEvent = useMemo(() => {
    const map = new Map<string, EventCatalogEntryResponse>();
    for (const entry of catalog.data ?? []) {
      if (!map.has(entry.eventName)) map.set(entry.eventName, entry);
    }
    return map;
  }, [catalog.data]);

  const eventOptions = useMemo(
    () =>
      Array.from(catalogByEvent.keys()).map((eventName) => ({
        label: eventName,
        value: eventName,
      })),
    [catalogByEvent],
  );

  const propertyOptions = useMemo(() => {
    if (!event) return [];
    const entry = catalogByEvent.get(event);
    if (!entry) return [];
    return entry.properties.map((prop) => ({
      label: prop,
      value: prop,
    }));
  }, [catalogByEvent, event]);

  const saveWidgetData = useCallback(
    async (nextEvent: string | null, nextProperty: string | null) => {
      if (!widgetId) return;

      setSaving(true);
      setSaveError(null);

      try {
        const preference = await getPreference<{ layouts: LayoutItem[] }>(
          PREFERENCE_KEYS.DASHBOARD_LAYOUT,
        );
        const layouts = preference?.layouts ?? [];
        const updatedLayouts = layouts.map((item) =>
          item.id === widgetId
            ? {
                ...item,
                data: {
                  ...item.data,
                  event: nextEvent,
                  property: nextProperty,
                },
              }
            : item,
        );

        await setPreference(
          PREFERENCE_KEYS.DASHBOARD_LAYOUT,
          { layouts: updatedLayouts },
          false,
        );
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : 'Failed to save widget config.',
        );
      } finally {
        setSaving(false);
      }
    },
    [widgetId, getPreference, setPreference],
  );

  useEffect(() => {
    if (!widgetId || !dirty) return;

    const timer = setTimeout(() => {
      saveWidgetData(event, property);
    }, 500);

    return () => clearTimeout(timer);
  }, [event, property, widgetId, dirty, saveWidgetData]);

  const handleEventChange = useCallback((nextEvent: string | null) => {
    setDirty(true);
    setEvent(nextEvent);
    setProperty(null);
  }, []);

  const handlePropertyChange = useCallback((nextProperty: string | null) => {
    setDirty(true);
    setProperty(nextProperty);
  }, []);

  if (!selectedTenantID) {
    return (
      <WidgetContainer>
        <EmptyMessage>Select a tenant to configure this widget.</EmptyMessage>
      </WidgetContainer>
    );
  }

  if (isEditing) {
    return (
      <WidgetContainer ref={rootRef}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}
        >
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--theme-text)',
            }}
          >
            Configure event card
          </span>
          {event && property && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{
                fontSize: '0.75rem',
                color: 'var(--theme-text)',
                background: 'var(--theme-elevation-0)',
                border: '1px solid var(--theme-elevation-200)',
                borderRadius: '0.25rem',
                padding: '0.25rem 0.5rem',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          )}
        </div>

        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          <CompactSelectField
            value={event}
            onChange={handleEventChange}
            options={eventOptions}
            placeholder="Select an event…"
            emptyMessage="No events found."
            loading={catalog.loading}
            error={catalog.error ?? undefined}
          />

          <CompactSelectField
            value={property}
            onChange={handlePropertyChange}
            options={propertyOptions}
            placeholder={
              event ? 'Select a property…' : 'Select an event first.'
            }
            emptyMessage="No properties found."
            disabled={!event}
          />
        </div>

        {saving && (
          <div
            style={{
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--theme-elevation-500)',
              textAlign: 'center',
            }}
          >
            Saving…
          </div>
        )}

        {saveError && (
          <div
            style={{
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--theme-error-text)',
              textAlign: 'center',
            }}
          >
            {saveError}
          </div>
        )}
      </WidgetContainer>
    );
  }

  if (contentLoading && !eventDataValues.data) {
    return <WidgetSkeleton height="100%" count={1} shimmerHeight={80} />;
  }

  if (contentError) {
    return (
      <WidgetContainer ref={rootRef}>
        <WidgetErrorState
          title="Could not load event data."
          description="Please contact the support team."
          onRetry={eventDataValues.refetch}
          retrying={contentLoading}
        />
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer ref={rootRef}>
      <div
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          zIndex: 1,
        }}
      >
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          style={{
            fontSize: '0.75rem',
            color: 'var(--theme-text)',
            background: 'var(--theme-elevation-0)',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '0.25rem',
            padding: '0.25rem 0.5rem',
            cursor: 'pointer',
          }}
        >
          Edit
        </button>
      </div>

      {event && property ? (
        <ChartContent
          event={event}
          property={property}
          data={eventDataValues.data ?? []}
        />
      ) : event ? (
        <EmptyMessage>Select a property to view data.</EmptyMessage>
      ) : null}
    </WidgetContainer>
  );
}

const WidgetContainer = forwardRef<HTMLDivElement, { children: ReactNode }>(
  function WidgetContainer({ children }, ref) {
    return (
      <div
        ref={ref}
        style={{
          position: 'relative',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: '0.5rem',
          padding: '1rem',
          background: 'var(--theme-elevation-0)',
          height: '100%',
        }}
      >
        {children}
      </div>
    );
  },
);

function EmptyMessage({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--theme-elevation-500)',
        fontSize: '0.875rem',
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
}

function buildSegments(values: { x: string; y: number }[]): PieChartWidgetSegment[] {
  const total = values.reduce((sum, entry) => sum + entry.y, 0);
  if (total === 0) return [];

  const sorted = [...values].sort((a, b) => b.y - a.y);
  const top = sorted.slice(0, MAX_SEGMENTS);
  const otherCount = sorted
    .slice(MAX_SEGMENTS)
    .reduce((sum, entry) => sum + entry.y, 0);

  const segments = top.map((entry, index) => ({
    key: entry.x,
    label: entry.x,
    color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
    value: Math.round((entry.y / total) * 100),
    rawValue: entry.y,
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
}

function ChartContent({
  event,
  property,
  data,
}: {
  event: string;
  property: string;
  data: EventValuesResponse[];
}) {
  const values = data.map((r) => ({ x: r.value, y: r.total }));
  const title = `${event} by ${property}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <h4
        style={{
          margin: 0,
          marginBottom: '0.75rem',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--theme-text)',
          width: '100%',
        }}
      >
        {title}
      </h4>
      {values.length === 0 ? (
        <div
          style={{
            width: '100%',
            height: '220px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--theme-elevation-500)',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          No data for this property in the selected period.
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '22rem' }}>
          <PieChartWidget
            segments={buildSegments(values)}
            formatValue={(segment) =>
              (segment.rawValue ?? segment.value).toLocaleString()
            }
            formatTooltip={(segment) =>
              `${segment.label}: ${(segment.rawValue ?? segment.value).toLocaleString()} (${segment.value}%)`
            }
          />
        </div>
      )}
    </div>
  );
}
