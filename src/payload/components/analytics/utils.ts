import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';

dayjs.extend(utc);

export function getUtcDayStart(date: string): number {
  return dayjs.utc(date).startOf('day').valueOf();
}

export function getUtcDayEnd(date: string): number {
  return dayjs.utc(date).endOf('day').valueOf();
}

/**
 * Validates a custom date range whose calendar dates are interpreted in UTC.
 * @param start - Start date in YYYY-MM-DD format
 * @param end - End date in YYYY-MM-DD format
 * @returns Error message if invalid, null if valid
 */
export function validateDateRange(start: string, end: string): string | null {
  if (!start || !end) {
    return 'Both start and end dates are required';
  }

  const startDate = dayjs.utc(start);
  const endDate = dayjs.utc(end);
  const today = dayjs.utc().format('YYYY-MM-DD');
  if (!startDate.isValid() || !endDate.isValid()) {
    return 'Invalid date format';
  }

  if (endDate.isBefore(startDate, 'day')) {
    return 'End date must be after start date';
  }

  if (start > today || end > today) {
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
