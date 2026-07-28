'use client';

import { LanguagesIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getLanguageName } from '../lib/language-names';
import { cn } from '../lib/utils';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

type LanguageSwitcherPrimitiveProps = {
  value: string;
  onValueChange: (locale: string) => void;
  locales: string[];
  triggerId: string;
  contentId: string;
  align?: 'start' | 'end';
  triggerClassName?: string;
  showIcon?: boolean;
};

/**
 * Presentational locale `Select` — no routing/navigation side effects.
 * Used by the header's `LanguageSwitcher` (which adds routing + tracking)
 * and by the print dialog's directory-language picker.
 */
export const LanguageSwitcherPrimitive = ({
  value,
  onValueChange,
  locales,
  triggerId,
  contentId,
  align = 'end',
  triggerClassName,
  showIcon = true,
}: LanguageSwitcherPrimitiveProps) => {
  const { t } = useTranslation('common');

  return (
    <Select
      a11yLabel={
        <Label htmlFor={triggerId} className="sr-only">
          {t('header.language_select_label')}
        </Label>
      }
      contentId={contentId}
      value={value}
      onValueChange={onValueChange}
    >
      <SelectTrigger
        id={triggerId}
        className={cn(
          'flex border-input h-full w-auto min-w-36 cursor-pointer items-center gap-1',
          triggerClassName,
        )}
      >
        <div className="flex items-center gap-1 overflow-hidden">
          {showIcon && <LanguagesIcon className="size-4" aria-hidden="true" />}
          <SelectValue placeholder={t('header.language_select_label')}>
            <span className="text-xs leading-5 font-medium capitalize">
              {getLanguageName(value)}
            </span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent align={align}>
        {locales.map((locale: string) => {
          const languageName = getLanguageName(locale);

          return (
            <SelectItem key={locale} value={locale}>
              <span className="text-xs font-medium capitalize">
                {languageName}
              </span>
              {` (${locale})`}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
