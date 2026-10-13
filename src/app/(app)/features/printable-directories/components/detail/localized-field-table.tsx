'use client';

import { ChevronUpIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/app/(app)/shared/components/ui/badge';
import { Button } from '@/app/(app)/shared/components/ui/button';
import { Input } from '@/app/(app)/shared/components/ui/input';
import { Label } from '@/app/(app)/shared/components/ui/label';
import { Textarea } from '@/app/(app)/shared/components/ui/textarea';
import { usePrintableDirectoryCapability } from '@/app/(app)/shared/hooks/use-printable-directory-capability';
import { getLanguageName } from '@/app/(app)/shared/lib/language-names';
import { PrintableDirectoryLocalizedValuesDto } from '@/lib/api/generated/data-contracts';

import { orderLocales } from '../../utils/orderLocales';

type LocalizedFieldTableProps = {
  label: string;
  value: PrintableDirectoryLocalizedValuesDto;
  onChange: (next: PrintableDirectoryLocalizedValuesDto) => void;
  /** The directory's primary language: listed first; the translation source. */
  primaryLanguage: string;
  /** The directory's languages (`directory.locales`): one row each. The
   *  list itself is edited in the general info dialog. */
  locales: string[];
  multiline?: boolean;
};

/**
 * Edits one localized field in each of the directory's languages (see
 * docs/printable-directories.md, "Localization & automatic translation").
 * Collapsed, it lists only the primary language and the current UI
 * language; the other languages expand on demand.
 *
 * Also maintains `autoTranslatedLocales`: typing in a language makes it
 * human-edited, so automatic translation never overwrites it again.
 */
export function LocalizedFieldTable({
  label,
  value,
  onChange,
  primaryLanguage,
  locales,
  multiline = false,
}: LocalizedFieldTableProps) {
  const { t, i18n } = useTranslation(['page-directories']);
  const [isExpanded, setIsExpanded] = useState(false);
  const canAutoTranslate = usePrintableDirectoryCapability(
    'automaticTranslation',
  );

  const values = value.values ?? {};
  const autoTranslatedLocales = value.autoTranslatedLocales ?? [];
  const allRows = orderLocales(locales, primaryLanguage);
  const collapsedRows = allRows.filter(
    (locale) => locale === primaryLanguage || locale === i18n.language,
  );
  const hiddenCount = allRows.length - collapsedRows.length;
  const rows = isExpanded ? allRows : collapsedRows;

  const setLocaleValue = (locale: string, text: string) => {
    onChange({
      values: { ...values, [locale]: text },
      autoTranslatedLocales: autoTranslatedLocales.filter(
        (candidate) => candidate !== locale,
      ),
    });
  };

  const languageName = (locale: string) =>
    getLanguageName(locale, { englishName: true });

  const getFieldProps = (locale: string) => ({
    'aria-label': `${label} (${languageName(locale)})`,
    value: values[locale] ?? '',
  });

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="p-2 text-left font-medium">
                {t('locale_label', { ns: 'page-directories' })}
              </th>
              <th className="p-2 text-left font-medium">{label}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((locale) => (
              <tr key={locale} className="border-b last:border-b-0">
                <td className="w-36 p-2 align-top">
                  <div className="flex flex-col items-start gap-1 leading-tight">
                    <span className="font-medium">{languageName(locale)}</span>
                    {locale === primaryLanguage ? (
                      <Badge variant="outline" className="text-xs">
                        {t('localized_field.primary_language', {
                          ns: 'page-directories',
                        })}
                      </Badge>
                    ) : (
                      autoTranslatedLocales.includes(locale) &&
                      Boolean(values[locale]?.trim()) && (
                        <Badge variant="outline" className="text-xs">
                          {t('localized_field.machine_translated', {
                            ns: 'page-directories',
                          })}
                        </Badge>
                      )
                    )}
                  </div>
                </td>
                <td className="p-2">
                  {multiline ? (
                    <Textarea
                      {...getFieldProps(locale)}
                      onChange={(event) =>
                        setLocaleValue(locale, event.target.value)
                      }
                    />
                  ) : (
                    <Input
                      {...getFieldProps(locale)}
                      onChange={(event) =>
                        setLocaleValue(locale, event.target.value)
                      }
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hiddenCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((previous) => !previous)}
        >
          {isExpanded ? (
            <ChevronUpIcon className="size-3.5" aria-hidden="true" />
          ) : (
            <PlusIcon className="size-3.5" aria-hidden="true" />
          )}
          {isExpanded
            ? t('localized_field.show_fewer_languages', {
                ns: 'page-directories',
              })
            : t('localized_field.show_more_languages', {
                ns: 'page-directories',
                count: hiddenCount,
              })}
        </Button>
      )}

      {canAutoTranslate && allRows.length > 1 && (
        <p className="text-muted-foreground text-xs">
          {t('localized_field.auto_translate_hint', {
            ns: 'page-directories',
          })}
        </p>
      )}
    </div>
  );
}
