'use client';

import { Clock3 } from 'lucide-react';
import { type ReactNode, useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PrintFormatOptions } from '@/app/(app)/shared/components/directory-print/print-format-options';
import {
  type FontSizeMode,
  type PrintVariant,
} from '@/app/(app)/shared/components/directory-print/pdf-print-primitives';
import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';
import { Textarea } from '@/app/(app)/shared/components/ui/textarea';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { cn } from '@/app/(app)/shared/lib/utils';
import { PrintableDirectoryDeliveryResponseDto } from '@/lib/api/generated/data-contracts';

import {
  DeliveryFrequency,
  DeliveryInput,
  formatMonthDay,
  getWeekdayNames,
  MAX_DELIVERY_RECIPIENTS,
  MONTH_DAY_PRESETS,
  MONTH_DAYS,
  parseRecipients,
  WEEKDAY_PRESETS,
  WEEKDAYS_MONDAY_FIRST,
} from '../../utils/scheduledDelivery';
import { ScheduleSummary } from './scheduled-delivery-summary';

type ScheduledDeliveryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The delivery being edited; omitted when adding one. */
  delivery?: PrintableDirectoryDeliveryResponseDto;
  locales: string[];
  defaultLocale: string;
  isSubmitting: boolean;
  onSubmit: (input: DeliveryInput) => void;
};

type DayToggleProps = {
  /** Smaller cell, for the 28-day month grid. */
  compact?: boolean;
  label: string;
  ariaLabel?: string;
  pressed: boolean;
  onToggle: () => void;
};

function DayToggle({
  compact = false,
  label,
  ariaLabel,
  pressed,
  onToggle,
}: DayToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      onClick={onToggle}
      className={cn(
        'flex cursor-pointer items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        compact ? 'h-9 min-w-9 px-1' : 'h-10 min-w-10 px-2',
        pressed
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input bg-background hover:border-primary/50 hover:bg-primary/5',
      )}
    >
      {label}
    </button>
  );
}

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="text-base font-semibold">
      {children}
    </h3>
  );
}

function toggle(values: number[], value: number): number[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function ScheduledDeliveryDialog({
  open,
  onOpenChange,
  delivery,
  locales,
  defaultLocale,
  isSubmitting,
  onSubmit,
}: ScheduledDeliveryDialogProps) {
  const { t, i18n } = useTranslation(['page-directories', 'common']);
  const recipientsId = useId();
  const recipientsHelpId = useId();
  const recipientsErrorId = useId();
  const scheduleId = useId();
  const pdfId = useId();

  const [frequency, setFrequency] = useState<DeliveryFrequency>('weekly');
  const [weekdays, setWeekdays] = useState<number[]>([1]);
  const [monthDays, setMonthDays] = useState<number[]>([1]);
  const [variant, setVariant] = useState<PrintVariant>('line-listing');
  const [fontSize, setFontSize] = useState<FontSizeMode>('default');
  const [booklet, setBooklet] = useState(false);
  const [locale, setLocale] = useState(defaultLocale);
  const [recipientsText, setRecipientsText] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;

    setFrequency(delivery?.frequency ?? 'weekly');
    setWeekdays(delivery?.weekdays.length ? delivery.weekdays : [1]);
    setMonthDays(delivery?.monthDays.length ? delivery.monthDays : [1]);
    setVariant(delivery?.print.variant ?? 'line-listing');
    setFontSize(delivery?.print.fontSize ?? 'default');
    setBooklet(delivery?.print.booklet ?? false);
    setLocale(
      delivery && locales.includes(delivery.print.locale)
        ? delivery.print.locale
        : defaultLocale,
    );
    setRecipientsText(delivery?.recipients.join('\n') ?? '');
    setShowErrors(false);
  }, [open, delivery, locales, defaultLocale]);

  const weekdayNames = useMemo(
    () => getWeekdayNames(i18n.language),
    [i18n.language],
  );
  const weekdayLongNames = useMemo(
    () => getWeekdayNames(i18n.language, 'long'),
    [i18n.language],
  );
  const recipients = useMemo(
    () => parseRecipients(recipientsText),
    [recipientsText],
  );

  const selectedDays = frequency === 'weekly' ? weekdays : monthDays;
  const daysError =
    selectedDays.length === 0 ? t('scheduled_delivery_days_required') : null;
  const recipientsError =
    recipients.invalid.length > 0
      ? t('scheduled_delivery_recipients_invalid', {
          emails: recipients.invalid.join(', '),
          // React escapes the output; i18next must not escape it again.
          interpolation: { escapeValue: false },
        })
      : recipients.valid.length === 0
        ? t('scheduled_delivery_recipients_required')
        : recipients.valid.length > MAX_DELIVERY_RECIPIENTS
          ? t('scheduled_delivery_recipients_too_many', {
              max: MAX_DELIVERY_RECIPIENTS,
            })
          : null;

  const handleSubmit = () => {
    if (daysError || recipientsError) {
      setShowErrors(true);
      return;
    }

    onSubmit({
      enabled: delivery?.enabled ?? true,
      frequency,
      weekdays: frequency === 'weekly' ? weekdays : [],
      monthDays: frequency === 'monthly' ? monthDays : [],
      print: { locale, variant, fontSize, booklet },
      recipients: recipients.valid,
    });
  };

  const frequencyOptions: { value: DeliveryFrequency; label: string }[] = [
    { value: 'weekly', label: t('scheduled_delivery_weekly') },
    { value: 'monthly', label: t('scheduled_delivery_monthly') },
  ];

  const presets =
    frequency === 'weekly'
      ? [
          {
            label: t('scheduled_delivery_preset_weekdays'),
            apply: () => setWeekdays([...WEEKDAY_PRESETS.weekdays]),
          },
          {
            label: t('scheduled_delivery_preset_mon_sat'),
            apply: () => setWeekdays([...WEEKDAY_PRESETS.monToSat]),
          },
          {
            label: t('scheduled_delivery_preset_every_day'),
            apply: () => setWeekdays([...WEEKDAY_PRESETS.everyDay]),
          },
        ]
      : [
          {
            label: t('scheduled_delivery_preset_first'),
            apply: () => setMonthDays([...MONTH_DAY_PRESETS.first]),
          },
          {
            label: t('scheduled_delivery_preset_first_and_sixteenth'),
            apply: () => setMonthDays([...MONTH_DAY_PRESETS.firstAndSixteenth]),
          },
          {
            label: t('scheduled_delivery_preset_fifteenth'),
            apply: () => setMonthDays([...MONTH_DAY_PRESETS.fifteenth]),
          },
        ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Header and footer stay put; only the body scrolls, and only when
        // the viewport is too short for it.
        className="flex max-h-[calc(100dvh-2rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0"
        closeLabel={t('call_to_action.close', { ns: 'common' })}
        data-testid="scheduled-delivery-dialog"
      >
        <DialogHeader className="border-b px-6 py-4 pr-14">
          <DialogTitle>
            {delivery
              ? t('scheduled_delivery_dialog_edit_title')
              : t('scheduled_delivery_dialog_add_title')}
          </DialogTitle>
          <DialogDescription>
            {t('scheduled_delivery_dialog_description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 divide-y overflow-y-auto px-6">
          <section className="space-y-3 py-4" aria-labelledby={scheduleId}>
            <SectionHeading id={scheduleId}>
              {t('scheduled_delivery_schedule_label')}
            </SectionHeading>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div
                role="radiogroup"
                aria-label={t('scheduled_delivery_frequency_label')}
                className="inline-flex rounded-md border border-input p-0.5"
              >
                {frequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={frequency === option.value}
                    onClick={() => setFrequency(option.value)}
                    className={cn(
                      'cursor-pointer rounded px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                      frequency === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-primary/5',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <Typography
                  as="span"
                  variant="paragraph"
                  size="sm"
                  textColor="secondary"
                  className="mr-1"
                >
                  {t('scheduled_delivery_presets_label')}
                </Typography>
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-sm underline-offset-4 hover:underline"
                    onClick={preset.apply}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {frequency === 'weekly' ? (
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={t('scheduled_delivery_weekdays_label')}
              >
                {WEEKDAYS_MONDAY_FIRST.map((day) => (
                  <DayToggle
                    key={day}
                    label={weekdayNames[day]}
                    ariaLabel={weekdayLongNames[day]}
                    pressed={weekdays.includes(day)}
                    onToggle={() =>
                      setWeekdays((current) => toggle(current, day))
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  className="grid max-w-sm grid-cols-7 gap-1.5 sm:max-w-none sm:grid-cols-14"
                  role="group"
                  aria-label={t('scheduled_delivery_month_days_label')}
                >
                  {MONTH_DAYS.map((day) => (
                    <DayToggle
                      key={day}
                      compact
                      label={String(day)}
                      ariaLabel={formatMonthDay(i18n.language, day)}
                      pressed={monthDays.includes(day)}
                      onToggle={() =>
                        setMonthDays((current) => toggle(current, day))
                      }
                    />
                  ))}
                </div>
                <Typography
                  variant="paragraph"
                  size="sm"
                  textColor="secondary"
                  className="text-xs"
                >
                  {t('scheduled_delivery_month_days_help')}
                </Typography>
              </div>
            )}

            {selectedDays.length > 0 ? (
              <Typography
                as="p"
                variant="paragraph"
                size="sm"
                className="flex items-center gap-2"
                aria-live="polite"
              >
                <Clock3
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <ScheduleSummary
                  frequency={frequency}
                  weekdays={weekdays}
                  monthDays={monthDays}
                  withTime
                />
              </Typography>
            ) : (
              showErrors &&
              daysError && (
                <Typography
                  as="p"
                  variant="paragraph"
                  size="sm"
                  className="text-destructive"
                  role="alert"
                >
                  {daysError}
                </Typography>
              )
            )}
          </section>

          <section className="space-y-3 py-4" aria-labelledby={pdfId}>
            <SectionHeading id={pdfId}>
              {t('scheduled_delivery_pdf_label')}
            </SectionHeading>
            <PrintFormatOptions
              layout="compact"
              selectedVariant={variant}
              onVariantChange={setVariant}
              fontSizeMode={fontSize}
              onFontSizeModeChange={setFontSize}
              selectedLocale={locale}
              onSelectedLocaleChange={setLocale}
              availableLocales={locales}
              isBookletLayout={booklet}
              onBookletLayoutChange={setBooklet}
            />
          </section>

          <section className="space-y-2 py-4">
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor={recipientsId} className="text-base font-semibold">
                {t('scheduled_delivery_recipients_label')}
              </label>
              <Typography
                variant="paragraph"
                size="sm"
                textColor="secondary"
                aria-live="polite"
              >
                {t('scheduled_delivery_recipients_count', {
                  count: recipients.valid.length,
                  max: MAX_DELIVERY_RECIPIENTS,
                })}
              </Typography>
            </div>
            <Textarea
              id={recipientsId}
              rows={3}
              value={recipientsText}
              onChange={(event) => setRecipientsText(event.target.value)}
              onBlur={() => setShowErrors(true)}
              placeholder="name@example.org, other@example.org"
              aria-invalid={showErrors && Boolean(recipientsError)}
              aria-describedby={`${recipientsHelpId} ${recipientsErrorId}`}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
            />
            <Typography
              id={recipientsHelpId}
              variant="paragraph"
              size="sm"
              textColor="secondary"
            >
              {t('scheduled_delivery_recipients_help')}
            </Typography>
            <div id={recipientsErrorId}>
              {showErrors && recipientsError && (
                <Typography
                  as="p"
                  variant="paragraph"
                  size="sm"
                  className="text-destructive"
                  role="alert"
                >
                  {recipientsError}
                </Typography>
              )}
            </div>
          </section>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('call_to_action.cancel', { ns: 'common' })}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            data-testid="scheduled-delivery-save-btn"
          >
            {t('call_to_action.save', { ns: 'common' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
