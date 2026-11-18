'use client';

import { Button } from '@payloadcms/ui';
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';

import {
  analyticsDateRangeAtom,
  analyticsSelectedWebsiteIdsAtom,
} from './DateRange';
import { getUtcDayEnd, getUtcDayStart } from './utils';
import {
  getNormalizedCustomBasePath,
  withOptionalTrailingSlash,
} from '@/app/(app)/shared/lib/utils';
export default function ExportCSVButton() {
  const range = useAtomValue(analyticsDateRangeAtom);
  const websiteIds = useAtomValue(analyticsSelectedWebsiteIdsAtom);
  const { selectedTenantID } = useTenantSelection();

  if (!selectedTenantID) return null;

  const handleExport = () => {
    let startAt: number;
    let endAt: number;

    if (typeof range === 'number') {
      const now = dayjs.utc();
      endAt = now.valueOf();
      startAt = now.subtract(range, 'day').valueOf();
    } else {
      startAt = getUtcDayStart(range.start);
      endAt = getUtcDayEnd(range.end);
    }

    window.location.assign(
      buildExportUrl({
        startAt,
        endAt,
        tenantId: String(selectedTenantID),
        websiteIds,
      }),
    );
  };

  return (
    <Button
      onClick={handleExport}
      buttonStyle="secondary"
      size="small"
    >
      Export CSV
    </Button>
  );
}

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

  return withOptionalTrailingSlash(
    `${getNormalizedCustomBasePath()}/api/export-search-analytics?${searchParams}`,
  );
}
