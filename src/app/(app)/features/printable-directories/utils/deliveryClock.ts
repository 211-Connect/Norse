/**
 * When scheduled PDF deliveries go out (docs/scheduled-pdf-delivery.md).
 * Kept free of heavy imports: the Payload job config uses it.
 */

/** Every delivery goes out around this hour, in this time zone. */
export const DELIVERY_TIME_ZONE = 'America/New_York';
export const DELIVERY_HOUR = 3;

/** The calendar date (`YYYY-MM-DD`) and hour in the delivery time zone. */
export function getDeliveryClock(now: Date = new Date()): {
  date: string;
  hour: number;
} {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: DELIVERY_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map(({ type, value }) => [type, value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
  };
}
