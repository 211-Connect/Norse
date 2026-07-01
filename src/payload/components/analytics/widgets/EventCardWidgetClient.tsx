'use client';

import { Banner, StaggeredShimmers, usePreferences } from '@payloadcms/ui';
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import dayjs from 'dayjs';
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

import { fetchEventNames, fetchEventProperties } from '../analyticsCache';
import CompactSelectField from '../CompactSelectField';
import { PieChartWidget, PieChartWidgetSegment } from '../PieChartWidget';
import { StatCard } from '../StatCard';
import type { MetricEntry } from '../types';
import { useEventDataValues, useEvents } from '../useAnalyticsData';
import { useWidgetId } from '../useWidgetId';

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

const WIDE_RANGE = {
  start: dayjs().subtract(10, 'year').format('YYYY-MM-DD'),
  end: dayjs().format('YYYY-MM-DD'),
};

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

function toTrend(current: number, previous: number): number | undefined {
  if (!previous) return undefined;
  return ((current - previous) / previous) * 100;
}

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

  const [eventNames, setEventNames] = useState<MetricEntry[]>([]);
  const [allProperties, setAllProperties] = useState<
    { eventName: string; propertyName: string; total: number }[]
  >([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const eventsData = useEvents();
  const eventDataValues = useEventDataValues(event ?? '', property ?? '');

  const contentLoading =
    eventsData.loading || (eventDataValues?.loading ?? false);

  useEffect(() => {
    setEvent(widgetData?.event ?? null);
    setProperty(widgetData?.property ?? null);
    setIsEditing(!widgetData?.event);
    setDirty(false);
  }, [widgetData]);

  useEffect(() => {
    if (!selectedTenantID) {
      setEventNames([]);
      return;
    }

    setOptionsLoading(true);
    setOptionsError(null);

    fetchEventNames(
      WIDE_RANGE,
      selectedTenantID ? String(selectedTenantID) : undefined,
      [],
    )
      .then((namesData) => {
        setEventNames(namesData.eventNames);
      })
      .catch((err) => {
        setOptionsError(
          err instanceof Error ? err.message : 'Failed to load events.',
        );
      })
      .finally(() => {
        setOptionsLoading(false);
      });
  }, [selectedTenantID]);

  useEffect(() => {
    if (!selectedTenantID || !event) {
      setAllProperties([]);
      return;
    }

    setOptionsLoading(true);
    setOptionsError(null);

    fetchEventProperties(
      WIDE_RANGE,
      selectedTenantID ? String(selectedTenantID) : undefined,
      [],
      { event },
    )
      .then((propertiesData) => {
        setAllProperties(propertiesData.eventProperties);
      })
      .catch((err) => {
        setOptionsError(
          err instanceof Error ? err.message : 'Failed to load properties.',
        );
      })
      .finally(() => {
        setOptionsLoading(false);
      });
  }, [selectedTenantID, event]);

  const eventOptions = useMemo(
    () =>
      eventNames.map((entry) => ({
        label: `${entry.x} (${entry.y.toLocaleString()})`,
        value: entry.x,
      })),
    [eventNames],
  );

  const propertyOptions = useMemo(() => {
    if (!event) return [];

    return allProperties.map((propertyItem) => ({
      label: propertyItem.propertyName,
      value: propertyItem.propertyName,
    }));
  }, [allProperties, event]);

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
            loading={optionsLoading}
            error={optionsError}
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

  if (contentLoading) {
    return (
      <WidgetContainer ref={rootRef}>
        <StaggeredShimmers count={1} height={80} />
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer ref={rootRef}>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--theme-text)',
          background: 'var(--theme-elevation-0)',
          border: '1px solid var(--theme-elevation-200)',
          borderRadius: '0.25rem',
          padding: '0.25rem 0.5rem',
          cursor: 'pointer',
          zIndex: 1,
        }}
      >
        Edit
      </button>

      {event && property ? (
        <ChartContent
          event={event}
          property={property}
          eventDataValues={eventDataValues}
        />
      ) : event ? (
        <StatCard
          label={event}
          value={(eventsData.data?.eventTotals[event] ?? 0).toLocaleString()}
          trend={toTrend(
            eventsData.data?.eventTotals[event] ?? 0,
            eventsData.data?.prevEventTotals[event] ?? 0,
          )}
        />
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

function buildSegments(values: MetricEntry[]): PieChartWidgetSegment[] {
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
  eventDataValues,
}: {
  event: string;
  property: string;
  eventDataValues: ReturnType<typeof useEventDataValues>;
}) {
  const { error, data } = eventDataValues;

  if (error) {
    return (
      <Banner type="error">
        <strong>Could not load event data.</strong> Please contact the support
        team.
      </Banner>
    );
  }

  const values = data?.values ?? [];
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
