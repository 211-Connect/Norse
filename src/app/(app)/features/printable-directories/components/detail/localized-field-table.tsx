'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { translateLocalizedField } from '@/app/(app)/shared/serverActions/printableDirectories/translateLocalizedField';
import { Button } from '@/app/(app)/shared/components/ui/button';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { Input } from '@/app/(app)/shared/components/ui/input';
import { getLanguageName } from '@/app/(app)/shared/lib/language-names';
import { Label } from '@/app/(app)/shared/components/ui/label';
import { Textarea } from '@/app/(app)/shared/components/ui/textarea';

type LocalizedFieldTableProps = {
  label: string;
  values: Record<string, string>;
  onChange: (locale: string, next: string) => void;
  multiline?: boolean;
};

export function LocalizedFieldTable({
  label,
  values,
  onChange,
  multiline = false,
}: LocalizedFieldTableProps) {
  const { t } = useTranslation(['page-directories']);
  const [isTranslating, setIsTranslating] = useState(false);
  const appConfig = useAppConfig();
  const locales = appConfig.i18n.locales;
  const defaultLocale = appConfig.i18n.defaultLocale;

  const handleTranslate = async () => {
    const englishValue = (values.en ?? '').trim();
    if (!englishValue) {
      toast.error(
        t('translate_source_required', {
          ns: 'page-directories',
        }),
      );
      return;
    }

    setIsTranslating(true);

    try {
      const response = await translateLocalizedField({
        englishValue,
      });

      if (!response.success) {
        const keyByError = {
          unauthorized: 'translate_not_allowed',
          missing_source: 'translate_source_required',
          not_configured: 'translate_not_configured',
          translation_failed: 'translate_failed',
        } as const;

        toast.error(
          t(keyByError[response.error], {
            ns: 'page-directories',
          }),
        );
        return;
      }

      Object.entries(response.translations).forEach(
        ([locale, translatedValue]) => {
          onChange(locale, translatedValue);
        },
      );

      toast.success(
        t('translate_success', {
          ns: 'page-directories',
          count: Object.keys(response.translations).length,
        }),
      );
    } catch {
      toast.error(t('translate_failed', { ns: 'page-directories' }));
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleTranslate}
          loading={isTranslating}
        >
          {isTranslating
            ? t('translating', { ns: 'page-directories' })
            : t('translate', { ns: 'page-directories' })}
        </Button>
      </div>
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
            {locales.map((locale) => (
              <tr key={locale} className="border-b last:border-b-0">
                <td className="w-32 p-2 align-top">
                  <div className="flex flex-col leading-tight">
                    <span className="font-medium">
                      {getLanguageName(locale, { englishName: true })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {locale}
                      {locale === defaultLocale
                        ? ` · ${t('default_locale', { ns: 'page-directories' })}`
                        : ''}
                    </span>
                  </div>
                </td>
                <td className="p-2">
                  {multiline ? (
                    <Textarea
                      value={values[locale] ?? ''}
                      onChange={(event) => onChange(locale, event.target.value)}
                    />
                  ) : (
                    <Input
                      value={values[locale] ?? ''}
                      onChange={(event) => onChange(locale, event.target.value)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
