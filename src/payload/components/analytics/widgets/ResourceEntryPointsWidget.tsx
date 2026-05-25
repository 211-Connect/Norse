'use client';

import { Banner, StaggeredShimmers } from '@payloadcms/ui';

import { ResourceEntry } from '../../../../app/(app)/shared/lib/umami';
import { MetricsTable } from '../MetricsTable';
import { useResourceByEntry } from '../useAnalyticsData';

const ENTRY_LABELS: Record<string, string> = {
  [ResourceEntry.SearchCard]: 'Search results card',
  [ResourceEntry.DeepLink]: 'Deep link / external',
  [ResourceEntry.TopicCard]: 'Topic card',
  [ResourceEntry.Unknown]: 'Unknown',
};

const ENTRY_ORDER: string[] = [
  ResourceEntry.SearchCard,
  ResourceEntry.DeepLink,
  ResourceEntry.TopicCard,
  ResourceEntry.Unknown,
];

function humanizeRow(entry: { x: string; y: number }) {
  return {
    ...entry,
    x: ENTRY_LABELS[entry.x] ?? entry.x,
  };
}

function sortByKnownOrder(rows: { x: string; y: number }[]) {
  const indexOf = (label: string) => {
    const key = Object.keys(ENTRY_LABELS).find(
      (k) => ENTRY_LABELS[k] === label,
    );
    const i = key ? ENTRY_ORDER.indexOf(key) : -1;
    return i === -1 ? ENTRY_ORDER.length : i;
  };
  return [...rows].sort((a, b) => indexOf(a.x) - indexOf(b.x));
}

export default function ResourceEntryPointsWidget() {
  const { loading, error, data } = useResourceByEntry();

  if (loading) return <StaggeredShimmers count={5} height={40} />;

  if (error) {
    return (
      <Banner type="error">
        <strong>Could not load resource entry points.</strong> Please contact
        the support team.
      </Banner>
    );
  }

  const rows = sortByKnownOrder((data?.resourceByEntry ?? []).map(humanizeRow));

  return (
    <MetricsTable
      title="Resource page entry points"
      colLabel="Source"
      colValue="Views"
      rows={rows}
      emptyState="No resource view events recorded for this period."
    />
  );
}
