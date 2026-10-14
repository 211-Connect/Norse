'use client';

import { useEffect, useId, useMemo, useState } from 'react';
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
import { Label } from '@/app/(app)/shared/components/ui/label';
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
  label: string;
  ariaLabel?: string;
  pressed: boolean;
  onToggle: () => void;
};

function DayToggle({ label, ariaLabel, pressed, onToggle }: DayToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      onClick={onToggle}
      className={cn(
        'flex h-10 min-w-10 items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        pressed
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input bg-background hover:border-primary/50 hover:bg-primary/5',
      )}
    >
      {label}
    </button>
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        closeLabel={t('call_to_action.close', { ns: 'common' })}
        data-testid="scheduled-delivery-dialog"
      >
        <DialogHeader>
          <DialogTitle>
            {delivery
              ? t('scheduled_delivery_dialog_edit_title')
              : t('scheduled_delivery_dialog_add_title')}
          </DialogTitle>
          <DialogDescription>
            {t('scheduled_delivery_description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-semibold">
              {t('scheduled_delivery_frequency_label')}
            </legend>

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
                    'rounded px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    frequency === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-primary/5',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {frequency === 'weekly' ? (
              <div className="space-y-2">
                <Typography as="p" variant="paragraph" size="sm">
                  {t('scheduled_delivery_weekdays_label')}
                </Typography>
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
                      onToggle={() => setWeekdays(toggle(weekdays, day))}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setWeekdays([...WEEKDAY_PRESETS.weekdays])}
                  >
                    {t('scheduled_delivery_preset_weekdays')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setWeekdays([...WEEKDAY_PRESETS.monToSat])}
                  >
                    {t('scheduled_delivery_preset_mon_sat')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setWeekdays([...WEEKDAY_PRESETS.everyDay])}
                  >
                    {t('scheduled_delivery_preset_every_day')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Typography as="p" variant="paragraph" size="sm">
                  {t('scheduled_delivery_month_days_label')}
                </Typography>
                <div
                  className="grid max-w-sm grid-cols-7 gap-1.5"
                  role="group"
                  aria-label={t('scheduled_delivery_month_days_label')}
                >
                  {MONTH_DAYS.map((day) => (
                    <DayToggle
                      key={day}
                      label={String(day)}
                      ariaLabel={formatMonthDay(i18n.language, day)}
                      pressed={monthDays.includes(day)}
                      onToggle={() => setMonthDays(toggle(monthDays, day))}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMonthDays([...MONTH_DAY_PRESETS.first])}
                  >
                    {t('scheduled_delivery_preset_first')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setMonthDays([...MONTH_DAY_PRESETS.firstAndSixteenth])
                    }
                  >
                    {t('scheduled_delivery_preset_first_and_sixteenth')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setMonthDays([...MONTH_DAY_PRESETS.fifteenth])
                    }
                  >
                    {t('scheduled_delivery_preset_fifteenth')}
                  </Button>
                </div>
                <Typography variant="paragraph" size="sm" textColor="secondary">
                  {t('scheduled_delivery_month_days_help')}
                </Typography>
              </div>
            )}

            {showErrors && daysError && (
              <Typography
                as="p"
                variant="paragraph"
                size="sm"
                className="text-destructive"
                role="alert"
              >
                {daysError}
              </Typography>
            )}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-semibold">
              {t('scheduled_delivery_pdf_label')}
            </legend>
            <PrintFormatOptions
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
          </fieldset>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor={recipientsId} className="font-semibold">
                {t('scheduled_delivery_recipients_label')}
              </Label>
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
              rows={5}
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
              {t('scheduled_delivery_recipients_help', {
                max: MAX_DELIVERY_RECIPIENTS,
              })}
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
          </div>

          {selectedDays.length > 0 && (
            <div className="rounded-md bg-primary/5 p-3 text-sm">
              <ScheduleSummary
                frequency={frequency}
                weekdays={weekdays}
                monthDays={monthDays}
                withTime
              />
            </div>
          )}
        </div>

        <DialogFooter>
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
