'use client';

import { Button } from '@payloadcms/ui';
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';

import { analyticsDateRangeAtom, analyticsSelectedWebsiteIdsAtom } from './DateRange';

function buildExportUrl(params: {
  startAt: number;
  endAt: number;
  tenantId: string;
  websiteIds: string[];
}): string {
  const searchParams = new URLSearchParams({
    startAt: String(params.startAt),
    endAt: String(params.endAt),
    tenantId: params.tenantId,
  });

  if (params.websiteIds.length > 0) {
    searchParams.set('websiteIds', params.websiteIds.join(','));
  }

  return `/api/export-search-analytics?${searchParams}`;
}

export default function ExportCSVButton() {
  const range = useAtomValue(analyticsDateRangeAtom);
  const websiteIds = useAtomValue(analyticsSelectedWebsiteIdsAtom);
  const { selectedTenantID } = useTenantSelection();

  if (!selectedTenantID) return null;

  const tenantId = String(selectedTenantID);

  let startAt: number;
  let endAt: number;

  if (typeof range === 'number') {
    endAt = dayjs().valueOf();
    startAt = dayjs().subtract(range, 'day').valueOf();
  } else {
    startAt = dayjs(range.start).startOf('day').valueOf();
    endAt = dayjs(range.end).endOf('day').valueOf();
  }

  const href = buildExportUrl({
    startAt,
    endAt,
    tenantId,
    websiteIds,
  });

  return (
    <Button
      el="anchor"
      url={href}
      buttonStyle="secondary"
      size="small"
      newTab={false}
    >
      Export CSV
    </Button>
  );
}
