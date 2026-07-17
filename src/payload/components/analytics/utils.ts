import dayjs from 'dayjs';

import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';

/**
 * Validates a custom date range.
 * @param start - Start date in YYYY-MM-DD format
 * @param end - End date in YYYY-MM-DD format
 * @returns Error message if invalid, null if valid
 */
export function validateDateRange(start: string, end: string): string | null {
  if (!start || !end) {
    return 'Both start and end dates are required';
  }

  const startDate = dayjs(start);
  const endDate = dayjs(end);
  const today = dayjs();

  if (!startDate.isValid() || !endDate.isValid()) {
    return 'Invalid date format';
  }

  if (endDate.isBefore(startDate)) {
    return 'End date must be after start date';
  }

  if (startDate.isAfter(today) || endDate.isAfter(today)) {
    return 'Dates cannot be in the future';
  }

  const daysDiff = endDate.diff(startDate, 'day');
  if (daysDiff > 365) {
    return 'Date range cannot exceed one year (365 days)';
  }

  return null;
}

export function buildAnalyticsQuery(
  path: string,
  startAt: number,
  endAt: number,
  tenantId?: string | null,
  extra?: Record<string, string>,
  websiteIds?: string[],
): string {
  const params = new URLSearchParams({
    ...extra,
    ...(tenantId ? { tenantId } : {}),
    startAt: String(startAt),
    endAt: String(endAt),
  });

  if (websiteIds && websiteIds.length > 0) {
    params.set('websiteIds', websiteIds.join(','));
  }

  return withOptionalCustomBasePath(`/api${path}?${params.toString()}`);
}
