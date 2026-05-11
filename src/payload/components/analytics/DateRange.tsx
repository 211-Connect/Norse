'use client';

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { Button } from '@payloadcms/ui';
import { atom, useAtom } from 'jotai';
import { useEffect, useState } from 'react';

import { fetchWrapper } from '@/app/(app)/shared/lib/fetchWrapper';

import type { DateRange as DateRangeType } from './types';

const DATE_RANGES: DateRangeType[] = [7, 30, 90];

export const analyticsDateRangeAtom = atom<DateRangeType>(30);
export const analyticsSelectedWebsiteIdsAtom = atom<string[]>([]);

type TenantWebsiteConfig = {
  common?: {
    umamiWebsiteIds?: { websiteId?: string | null }[] | null;
  } | null;
};

type UmamiWebsiteListResponse = {
  websites: {
    id: string;
    name: string | null;
  }[];
};

function extractWebsiteIds(tenant: TenantWebsiteConfig | null): string[] {
  const websiteIds = Array.isArray(tenant?.common?.umamiWebsiteIds)
    ? tenant.common.umamiWebsiteIds
        .map((item) => item?.websiteId?.trim())
        .filter((id): id is string => Boolean(id))
    : [];

  return Array.from(new Set(websiteIds));
}

export default function DateRange() {
  const [range, setRange] = useAtom(analyticsDateRangeAtom);
  const [selectedWebsiteIds, setSelectedWebsiteIds] = useAtom(
    analyticsSelectedWebsiteIdsAtom,
  );
  const { selectedTenantID } = useTenantSelection();
  const [websiteIds, setWebsiteIds] = useState<string[]>([]);
  const [websiteNames, setWebsiteNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    const loadTenantWebsiteIds = async () => {
      if (!selectedTenantID) {
        setWebsiteIds([]);
        setWebsiteNames({});
        setSelectedWebsiteIds([]);
        return;
      }

      try {
        const tenant = await fetchWrapper<TenantWebsiteConfig>(
          `/api/tenants/${selectedTenantID}?depth=0`,
        );

        if (cancelled) return;

        const ids = extractWebsiteIds(tenant);
        setWebsiteIds(ids);
        setWebsiteNames({});
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
          }
        }
      } catch {
        if (cancelled) return;
        setWebsiteIds([]);
        setWebsiteNames({});
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

  const mainWebsiteId = websiteIds[0];
  const orderedWebsiteIds =
    mainWebsiteId === undefined
      ? websiteIds
      : [mainWebsiteId, ...websiteIds.filter((id) => id !== mainWebsiteId)];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'flex-end',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        {DATE_RANGES.map((d) => (
          <Button
            key={d}
            buttonStyle={range === d ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setRange(d)}
          >
            Last {d} days
          </Button>
        ))}
      </div>

      {websiteIds.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {orderedWebsiteIds.map((websiteId, index) => (
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
              {websiteNames[websiteId] ?? `Website ${index + 1}`}
              {websiteId === mainWebsiteId && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--theme-elevation-600)',
                  }}
                >
                  (Main website)
                </span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
