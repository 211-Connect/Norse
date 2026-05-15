'use client';

import { Banner, StaggeredShimmers } from '@payloadcms/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MetricsTable } from '../MetricsTable';
import { MetricEntry, ResourceTitleEntry } from '../types';
import { usePaths } from '../useAnalyticsData';
import { extractResourceId } from '../utils';

export default function ResourceTitlesWidget() {
  const { loading, error, data } = usePaths();
  const [titleMap, setTitleMap] = useState<Record<string, string>>({});
  const titleCacheRef = useRef<Map<string, string>>(new Map());

  const tenantId = useMemo(() => {
    return data?.tenantId;
  }, [data]);

  useEffect(() => {
    setTitleMap({});
    titleCacheRef.current.clear();
  }, [tenantId]);

  const rowsWithResolvedTitles = useMemo(() => {
    return (data?.resourceMetrics ?? []).map((row) => {
      const id = extractResourceId(row.x);
      if (!id) return row;
      return {
        x: titleMap[id] ?? row.x,
        y: row.y,
      };
    });
  }, [data?.resourceMetrics, titleMap]);

  const resolveTitlesForPage = useCallback(
    async (pageRows: MetricEntry[]) => {
      const ids = pageRows
        .map((row) => extractResourceId(row.x))
        .filter((id): id is string => id !== null);

      if (ids.length === 0) {
        return;
      }

      const uniqueMissingIds = Array.from(
        new Set(ids.filter((id) => !titleCacheRef.current.has(id))),
      );

      if (uniqueMissingIds.length > 0) {
        try {
          const response = await fetch('/api/resource-titles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: uniqueMissingIds, tenantId }),
          });

          if (response.ok) {
            const titles: ResourceTitleEntry[] = await response.json();
            for (const entry of titles) {
              titleCacheRef.current.set(entry.id, entry.displayName);
            }
          }
        } catch {
          // silently fall back to raw path labels
        }
      }

      setTitleMap((prev) => {
        const next = { ...prev };
        for (const [id, title] of titleCacheRef.current.entries()) {
          next[id] = title;
        }
        return next;
      });
    },
    [tenantId],
  );

  if (loading) return <StaggeredShimmers count={5} height={40} />;

  if (error) {
    return (
      <Banner type="error">
        <strong>Could not load resource titles.</strong> Please contact the
        support team.
      </Banner>
    );
  }

  return (
    <MetricsTable
      title="Resource clicks"
      colLabel="Resource"
      colValue="Referrals"
      rows={rowsWithResolvedTitles}
      onPageRowsChange={resolveTitlesForPage}
    />
  );
}
