'use client';

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { useAtom } from 'jotai';
import { useEffect, useRef } from 'react';

import { analyticsSelectedWebsiteIdsAtom } from './DateRange';
import { useAnalyticsInfo } from './useAnalyticsData';

export default function WebsitePicker() {
  const [selectedWebsiteIds, setSelectedWebsiteIds] = useAtom(
    analyticsSelectedWebsiteIdsAtom,
  );
  const { selectedTenantID } = useTenantSelection();
  const initializedRef = useRef(false);
  const prevTenantIdRef = useRef(selectedTenantID);

  const { data } = useAnalyticsInfo(
    selectedTenantID ? String(selectedTenantID) : undefined,
  );

  const websiteIds = [
    ...(data?.rootWebsiteId ? [data.rootWebsiteId] : []),
    ...(data?.additionalWebsiteIds ?? []),
  ];

  useEffect(() => {
    if (initializedRef.current) return;
    if (websiteIds.length > 0 && selectedWebsiteIds.length === 0) {
      setSelectedWebsiteIds([websiteIds[0]]);
      initializedRef.current = true;
    }
  }, [websiteIds, selectedWebsiteIds.length, setSelectedWebsiteIds]);

  useEffect(() => {
    if (prevTenantIdRef.current !== selectedTenantID) {
      initializedRef.current = false;
      setSelectedWebsiteIds([]);
      prevTenantIdRef.current = selectedTenantID;
    }
  }, [selectedTenantID, setSelectedWebsiteIds]);

  if (websiteIds.length === 0) return null;

  const nameMap = new Map<string, string>();
  for (const w of data?.websites ?? []) {
    if (w.name) nameMap.set(w.id, w.name);
  }

  const mainWebsiteId = websiteIds[0];
  const orderedWebsiteIds = [
    mainWebsiteId,
    ...websiteIds.filter((id) => id !== mainWebsiteId),
  ];

  const toggleWebsite = (websiteId: string, checked: boolean) => {
    setSelectedWebsiteIds((current) => {
      if (checked) {
        return current.includes(websiteId) ? current : [...current, websiteId];
      }

      if (current.length === 1 && current[0] === websiteId) {
        return current;
      }

      return current.filter((id) => id !== websiteId);
    });
  };

  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      {orderedWebsiteIds.map((websiteId) => (
        <label
          key={websiteId}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          <input
            type="checkbox"
            checked={selectedWebsiteIds.includes(websiteId)}
            onChange={(event) =>
              toggleWebsite(websiteId, event.currentTarget.checked)
            }
          />
          {nameMap.get(websiteId) ?? websiteId}
        </label>
      ))}
    </div>
  );
}
