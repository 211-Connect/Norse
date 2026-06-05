'use client';

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';

import { fetchWrapper } from '@/app/(app)/shared/lib/fetchWrapper';
import {
  TenantAnalytics,
  getConfiguredWebsiteIds,
} from '@/payload/utilities/getConfiguredWebsiteIds';

import { analyticsSelectedWebsiteIdsAtom } from './DateRange';

type TenantWebsiteConfig = {
  analytics?: TenantAnalytics | null;
};

type UmamiWebsiteListResponse = {
  websites: {
    id: string;
    name: string | null;
  }[];
};

export default function WebsitePicker() {
  const [selectedWebsiteIds, setSelectedWebsiteIds] = useAtom(
    analyticsSelectedWebsiteIdsAtom,
  );
  const { selectedTenantID } = useTenantSelection();
  const [websiteIds, setWebsiteIds] = useState<string[]>([]);
  const [websiteNames, setWebsiteNames] = useState<Record<string, string>>({});
  const [namesResolved, setNamesResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadTenantWebsiteIds = async () => {
      if (!selectedTenantID) {
        setWebsiteIds([]);
        setWebsiteNames({});
        setNamesResolved(false);
        setSelectedWebsiteIds([]);
        return;
      }

      try {
        const tenant = await fetchWrapper<TenantWebsiteConfig>(
          `/api/tenants/${selectedTenantID}?depth=0`,
        );

        if (cancelled) return;

        const ids = getConfiguredWebsiteIds(tenant?.analytics);
        setWebsiteIds(ids);
        setWebsiteNames({});
        setNamesResolved(false);
        setSelectedWebsiteIds(ids.length > 0 ? [ids[0]] : []);

        if (ids.length > 0) {
          try {
            const websiteData = await fetchWrapper<UmamiWebsiteListResponse>(
              `/api/umami-websites?tenantId=${encodeURIComponent(selectedTenantID)}&websiteIds=${encodeURIComponent(ids.join(','))}`,
            );

            if (cancelled) return;

            const nameMap = (websiteData?.websites ?? []).reduce<
              Record<string, string>
            >((acc, website) => {
              if (website.name) {
                acc[website.id] = website.name;
              }
              return acc;
            }, {});

            setWebsiteNames(nameMap);
          } catch {
            if (cancelled) return;
            setWebsiteNames({});
          } finally {
            if (!cancelled) setNamesResolved(true);
          }
        } else {
          setNamesResolved(true);
        }
      } catch {
        if (cancelled) return;
        setWebsiteIds([]);
        setWebsiteNames({});
        setNamesResolved(true);
        setSelectedWebsiteIds([]);
      }
    };

    loadTenantWebsiteIds();

    return () => {
      cancelled = true;
    };
  }, [selectedTenantID, setSelectedWebsiteIds]);

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

  if (!namesResolved || websiteIds.length === 0) return null;

  const mainWebsiteId = websiteIds[0];
  const orderedWebsiteIds = [
    mainWebsiteId,
    ...websiteIds.filter((id) => id !== mainWebsiteId),
  ];

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
          {websiteNames[websiteId]}
        </label>
      ))}
    </div>
  );
}
