import z from 'zod';

import {
  FONT_SIZE_MODES,
  PRINT_VARIANTS,
} from '@/app/(app)/shared/components/directory-print/print-options';
import { CreatePrintableDirectoryDeliveryDto } from '@/lib/api/generated/data-contracts';

/**
 * Scheduled PDF delivery rules shared by the dialog, the server actions and
 * the daily job. See docs/scheduled-pdf-delivery.md. The Norse API enforces
 * the same limits.
 */
export const MAX_DELIVERIES_PER_DIRECTORY = 100;
export const MAX_DELIVERY_RECIPIENTS = 100;
/** Month days stop at 28 so every month gets every selected day. */
export const MAX_DELIVERY_MONTH_DAY = 28;
export {
  DELIVERY_HOUR,
  DELIVERY_TIME_ZONE,
  getDeliveryClock,
} from './deliveryClock';

export type DeliveryFrequency =
  CreatePrintableDirectoryDeliveryDto['frequency'];
export type DeliveryInput = CreatePrintableDirectoryDeliveryDto;

/** Monday first; values are 0 (Sunday) to 6 (Saturday). */
export const WEEKDAYS_MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0] as const;

export const MONTH_DAYS = Array.from(
  { length: MAX_DELIVERY_MONTH_DAY },
  (_, index) => index + 1,
);

export const WEEKDAY_PRESETS = {
  weekdays: [1, 2, 3, 4, 5],
  monToSat: [1, 2, 3, 4, 5, 6],
  everyDay: [0, 1, 2, 3, 4, 5, 6],
} as const;

export const MONTH_DAY_PRESETS = {
  first: [1],
  firstAndSixteenth: [1, 16],
  fifteenth: [15],
} as const;

const recipientSchema = z.string().trim().toLowerCase().pipe(z.email());

export const deliveryInputSchema = z
  .object({
    enabled: z.boolean().optional(),
    frequency: z.enum(['weekly', 'monthly']),
    weekdays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
    monthDays: z
      .array(z.number().int().min(1).max(MAX_DELIVERY_MONTH_DAY))
      .max(MAX_DELIVERY_MONTH_DAY)
      .default([]),
    print: z.object({
      locale: z.string().min(1).max(32),
      variant: z.enum(PRINT_VARIANTS),
      fontSize: z.enum(FONT_SIZE_MODES),
      booklet: z.boolean(),
    }),
    recipients: z
      .array(recipientSchema)
      .min(1)
      .max(MAX_DELIVERY_RECIPIENTS)
      .transform((emails) => [...new Set(emails)]),
  })
  .refine(
    (input) =>
      input.frequency === 'weekly'
        ? input.weekdays.length > 0
        : input.monthDays.length > 0,
    { message: 'At least one day is required.', path: ['frequency'] },
  )
  .transform((input) => ({
    ...input,
    weekdays: input.frequency === 'weekly' ? sortedUnique(input.weekdays) : [],
    monthDays:
      input.frequency === 'monthly' ? sortedUnique(input.monthDays) : [],
  }));

function sortedUnique(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

/**
 * Splits pasted text (commas, semicolons, whitespace or new lines) into
 * trimmed, lowercased, deduplicated addresses, and separates out the ones
 * that aren't valid emails.
 */
export function parseRecipients(text: string): {
  valid: string[];
  invalid: string[];
} {
  const valid = new Set<string>();
  const invalid = new Set<string>();

  for (const token of text.split(/[\s,;]+/)) {
    const candidate = token.trim().toLowerCase();
    if (!candidate) continue;

    if (recipientSchema.safeParse(candidate).success) {
      valid.add(candidate);
    } else {
      invalid.add(token.trim());
    }
  }

  return { valid: [...valid], invalid: [...invalid] };
}

/** Localized short weekday names, indexed 0 (Sunday) to 6. */
export function getWeekdayNames(
  locale: string,
  width: 'short' | 'long' = 'short',
): string[] {
  const format = new Intl.DateTimeFormat(locale, {
    weekday: width,
    timeZone: 'UTC',
  });
  // 2023-01-01 was a Sunday.
  return Array.from({ length: 7 }, (_, day) =>
    format.format(new Date(Date.UTC(2023, 0, 1 + day))),
  );
}

/** "Mon, Wed and Fri" style list in the given locale. */
export function formatList(locale: string, items: string[]): string {
  try {
    return new Intl.ListFormat(locale, {
      style: 'long',
      type: 'conjunction',
    }).format(items);
  } catch {
    return items.join(', ');
  }
}

/** Monday-first order of the selected weekdays, as localized short names. */
export function formatWeekdays(locale: string, weekdays: number[]): string {
  const names = getWeekdayNames(locale);
  return formatList(
    locale,
    WEEKDAYS_MONDAY_FIRST.filter((day) => weekdays.includes(day)).map(
      (day) => names[day],
    ),
  );
}

/** Localized ordinal ("1st", "16th") where the locale supports it. */
export function formatMonthDay(locale: string, day: number): string {
  if (!locale.startsWith('en')) return String(day);

  const suffixes: Record<string, string> = {
    one: 'st',
    two: 'nd',
    few: 'rd',
    other: 'th',
  };
  const rule = new Intl.PluralRules('en-US', { type: 'ordinal' }).select(day);
  return `${day}${suffixes[rule] ?? 'th'}`;
}

export function formatMonthDays(locale: string, monthDays: number[]): string {
  return formatList(
    locale,
    monthDays.map((day) => formatMonthDay(locale, day)),
  );
}
