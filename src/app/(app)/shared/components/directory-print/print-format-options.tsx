'use client';

import { Check, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/app/(app)/shared/components/ui/checkbox';
import { Label } from '@/app/(app)/shared/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/(app)/shared/components/ui/tooltip';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import {
  PRINT_DIALOG_LANGUAGE_CONTENT_ID,
  PRINT_DIALOG_LANGUAGE_TRIGGER_ID,
} from '@/app/(app)/shared/lib/aria-constants';
import { cn } from '@/app/(app)/shared/lib/utils';

import { LanguageSwitcherPrimitive } from '../language-switcher-primitive';
import { type FontSizeMode, type PrintVariant } from './pdf-print-primitives';

type PrintFormatOptionsProps = {
  selectedVariant: PrintVariant;
  onVariantChange: (variant: PrintVariant) => void;
  fontSizeMode: FontSizeMode;
  onFontSizeModeChange: (mode: FontSizeMode) => void;
  selectedLocale: string;
  onSelectedLocaleChange: (locale: string) => void;
  availableLocales: string[];
  isBookletLayout?: boolean;
  /** Omit to hide the booklet option (only printable directories support it). */
  onBookletLayoutChange?: (value: boolean) => void;
  /**
   * `stacked` (default): full-width template cards and section headings, for
   * dialogs where these are the main content. `compact`: templates in a row
   * and small field labels, for a dialog where they are one section of many.
   */
  layout?: 'stacked' | 'compact';
};

const VARIANTS: { value: PrintVariant; labelKey: string; descKey: string }[] = [
  {
    value: 'line-listing',
    labelKey: 'print_dialog.line_listing',
    descKey: 'print_dialog.line_listing_desc',
  },
  {
    value: 'summary-listing',
    labelKey: 'print_dialog.summary_listing',
    descKey: 'print_dialog.summary_listing_desc',
  },
  {
    value: 'full-listing',
    labelKey: 'print_dialog.full_listing',
    descKey: 'print_dialog.full_listing_desc',
  },
];

const FONT_SIZES: { value: FontSizeMode; labelKey: string }[] = [
  { value: 'default', labelKey: 'print_dialog.font_size_standard' },
  { value: 'large', labelKey: 'print_dialog.font_size_large' },
];

function RadioDot({ checked, small }: { checked: boolean; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border-2',
        small ? 'size-4' : 'mt-0.5 size-5',
        checked ? 'border-primary bg-primary' : 'border-muted-foreground',
      )}
    >
      {checked && (
        <Check
          className={cn(
            'text-primary-foreground',
            small ? 'size-2.5' : 'size-3',
          )}
        />
      )}
    </span>
  );
}

/** "What does booklet layout mean?" next to the booklet option. */
export function BookletLayoutHelp() {
  const { t } = useTranslation('page-list');

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex size-6 cursor-help items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
            aria-label={t('print_dialog.booklet_layout_help')}
          >
            <Info className="size-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-left leading-snug">
          {t('print_dialog.booklet_layout_help')}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Print variant + font size + booklet + language controls shared by the
 * print, share and scheduled delivery dialogs, so all flows offer the same
 * directory-format choices. In the print and share dialogs these are
 * print-time-only choices (docs/adr/0002-remove-resource-layout-and-booklet-fields.md);
 * a scheduled delivery stores its own.
 */
export function PrintFormatOptions({
  selectedVariant,
  onVariantChange,
  fontSizeMode,
  onFontSizeModeChange,
  selectedLocale,
  onSelectedLocaleChange,
  availableLocales,
  isBookletLayout,
  onBookletLayoutChange,
  layout = 'stacked',
}: PrintFormatOptionsProps) {
  const { t } = useTranslation('page-list');
  const compact = layout === 'compact';
  const showLanguage = availableLocales.length > 1;

  const fieldLabel = (text: string, id?: string) =>
    compact ? (
      <Typography
        as="p"
        id={id}
        variant="paragraph"
        size="sm"
        className="font-medium"
      >
        {text}
      </Typography>
    ) : (
      <Typography id={id} variant="heading" size="sm">
        {text}
      </Typography>
    );

  const variantCards = (
    <div
      role="radiogroup"
      aria-label={t('print_dialog.select_format')}
      className={cn(
        'grid gap-3',
        compact ? 'grid-cols-1 gap-2 sm:grid-cols-3' : 'grid-cols-1',
      )}
    >
      {VARIANTS.map(({ value, labelKey, descKey }) => {
        const checked = selectedVariant === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onVariantChange(value)}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border-2 text-left transition-colors',
              compact ? 'p-3' : 'p-4',
              checked
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
            )}
          >
            <RadioDot checked={checked} small={compact} />
            <span className="flex-1">
              <Typography
                as="span"
                variant={compact ? 'paragraph' : 'heading'}
                size="sm"
                className={cn('block', compact ? 'font-semibold' : 'mb-1')}
              >
                {t(labelKey)}
              </Typography>
              <Typography
                as="span"
                variant="paragraph"
                size="sm"
                textColor="secondary"
                className={cn('block', compact && 'mt-0.5 text-xs')}
              >
                {t(descKey)}
              </Typography>
            </span>
          </button>
        );
      })}
    </div>
  );

  const fontSize = (
    <div className={cn('flex flex-col', compact ? 'gap-2' : 'gap-3')}>
      {fieldLabel(t('print_dialog.font_size_title'), 'print-format-font-size')}
      <div
        role="radiogroup"
        aria-labelledby="print-format-font-size"
        className="grid grid-cols-2 gap-3"
      >
        {FONT_SIZES.map(({ value, labelKey }) => {
          const checked = fontSizeMode === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onFontSizeModeChange(value)}
              className={cn(
                'flex h-9 cursor-pointer items-center gap-2 rounded-lg border-2 px-3 text-left text-sm transition-colors',
                checked
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
              )}
            >
              <RadioDot checked={checked} small />
              {t(labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );

  const language = showLanguage && (
    <div className={cn('flex flex-col', compact ? 'gap-2' : 'gap-3')}>
      {fieldLabel(t('print_dialog.language_title'))}
      <LanguageSwitcherPrimitive
        value={selectedLocale}
        onValueChange={onSelectedLocaleChange}
        locales={availableLocales}
        triggerId={PRINT_DIALOG_LANGUAGE_TRIGGER_ID}
        contentId={PRINT_DIALOG_LANGUAGE_CONTENT_ID}
        align="start"
        triggerClassName={cn('w-full', compact && 'h-9')}
        showIcon={false}
      />
    </div>
  );

  const booklet = onBookletLayoutChange && (
    <div className="flex items-center gap-2">
      <Checkbox
        id="print-format-booklet-layout"
        checked={isBookletLayout ?? false}
        onCheckedChange={(value) => onBookletLayoutChange(value === true)}
      />
      <Label htmlFor="print-format-booklet-layout" className="cursor-pointer">
        {t('print_dialog.booklet_layout')}
      </Label>
      <BookletLayoutHelp />
    </div>
  );

  if (compact) {
    return (
      <div className="flex flex-col gap-4">
        {variantCards}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fontSize}
          {language}
        </div>
        {booklet}
      </div>
    );
  }

  return (
    <>
      {variantCards}
      {fontSize}
      {booklet}
      {language}
    </>
  );
}
