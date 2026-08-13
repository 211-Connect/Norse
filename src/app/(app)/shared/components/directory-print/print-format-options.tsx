'use client';

import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
};

/**
 * Print variant + font size + language controls shared by the print dialog
 * and the share dialog, so both flows offer the same directory-format
 * choices.
 */
export function PrintFormatOptions({
  selectedVariant,
  onVariantChange,
  fontSizeMode,
  onFontSizeModeChange,
  selectedLocale,
  onSelectedLocaleChange,
  availableLocales,
}: PrintFormatOptionsProps) {
  const { t } = useTranslation('page-list');

  return (
    <>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onVariantChange('line-listing')}
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors',
            selectedVariant === 'line-listing'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50',
          )}
        >
          <div
            className={cn(
              'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
              selectedVariant === 'line-listing'
                ? 'border-primary bg-primary'
                : 'border-muted-foreground',
            )}
          >
            {selectedVariant === 'line-listing' && (
              <Check className="text-primary-foreground size-3" />
            )}
          </div>
          <div className="flex-1">
            <Typography variant="heading" size="sm" className="mb-1">
              {t('print_dialog.line_listing')}
            </Typography>
            <Typography variant="paragraph" size="sm" textColor="secondary">
              {t('print_dialog.line_listing_desc')}
            </Typography>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onVariantChange('summary-listing')}
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors',
            selectedVariant === 'summary-listing'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50',
          )}
        >
          <div
            className={cn(
              'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
              selectedVariant === 'summary-listing'
                ? 'border-primary bg-primary'
                : 'border-muted-foreground',
            )}
          >
            {selectedVariant === 'summary-listing' && (
              <Check className="text-primary-foreground size-3" />
            )}
          </div>
          <div className="flex-1">
            <Typography variant="heading" size="sm" className="mb-1">
              {t('print_dialog.summary_listing')}
            </Typography>
            <Typography variant="paragraph" size="sm" textColor="secondary">
              {t('print_dialog.summary_listing_desc')}
            </Typography>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onVariantChange('full-listing')}
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors',
            selectedVariant === 'full-listing'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50',
          )}
        >
          <div
            className={cn(
              'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
              selectedVariant === 'full-listing'
                ? 'border-primary bg-primary'
                : 'border-muted-foreground',
            )}
          >
            {selectedVariant === 'full-listing' && (
              <Check className="text-primary-foreground size-3" />
            )}
          </div>
          <div className="flex-1">
            <Typography variant="heading" size="sm" className="mb-1">
              {t('print_dialog.full_listing')}
            </Typography>
            <Typography variant="paragraph" size="sm" textColor="secondary">
              {t('print_dialog.full_listing_desc')}
            </Typography>
          </div>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <Typography variant="heading" size="sm">
          {t('print_dialog.font_size_title')}
        </Typography>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onFontSizeModeChange('default')}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors',
              fontSizeMode === 'default'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
            )}
          >
            <div
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                fontSizeMode === 'default'
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground',
              )}
            >
              {fontSizeMode === 'default' && (
                <Check className="text-primary-foreground size-2.5" />
              )}
            </div>
            {t('print_dialog.font_size_standard')}
          </button>

          <button
            type="button"
            onClick={() => onFontSizeModeChange('large')}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors',
              fontSizeMode === 'large'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
            )}
          >
            <div
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                fontSizeMode === 'large'
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground',
              )}
            >
              {fontSizeMode === 'large' && (
                <Check className="text-primary-foreground size-2.5" />
              )}
            </div>
            {t('print_dialog.font_size_large')}
          </button>
        </div>
      </div>

      {availableLocales.length > 1 && (
        <div className="flex flex-col gap-3">
          <Typography variant="heading" size="sm">
            {t('print_dialog.language_title')}
          </Typography>
          <LanguageSwitcherPrimitive
            value={selectedLocale}
            onValueChange={onSelectedLocaleChange}
            locales={availableLocales}
            triggerId={PRINT_DIALOG_LANGUAGE_TRIGGER_ID}
            contentId={PRINT_DIALOG_LANGUAGE_CONTENT_ID}
            align="start"
            triggerClassName="w-full"
            showIcon={false}
          />
        </div>
      )}
    </>
  );
}
