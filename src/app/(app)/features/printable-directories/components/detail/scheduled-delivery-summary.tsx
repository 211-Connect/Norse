'use client';

import { useTranslation } from 'react-i18next';

import {
  DeliveryFrequency,
  formatMonthDays,
  formatWeekdays,
} from '../../utils/scheduledDelivery';

type ScheduleSummaryProps = {
  frequency: DeliveryFrequency;
  weekdays: number[];
  monthDays: number[];
  /** Adds "around 3:00 AM Eastern Time". */
  withTime?: boolean;
};

/** "Every Mon, Wed and Fri" / "Monthly on the 1st and 16th". */
export function ScheduleSummary({
  frequency,
  weekdays,
  monthDays,
  withTime = false,
}: ScheduleSummaryProps) {
  const { t, i18n } = useTranslation('page-directories');

  const schedule =
    frequency === 'weekly'
      ? t('scheduled_delivery_every_weekdays', {
          days: formatWeekdays(i18n.language, weekdays),
        })
      : t('scheduled_delivery_every_month_days', {
          days: formatMonthDays(i18n.language, monthDays),
        });

  return (
    <>{withTime ? t('scheduled_delivery_summary', { schedule }) : schedule}</>
  );
}
