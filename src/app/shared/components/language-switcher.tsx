'use client';

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePathname, useRouter } from 'next/navigation';

import i18nConfig from '@/i18nConfig';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { LanguagesIcon } from 'lucide-react';
import { useClientSearchParams } from '../hooks/use-client-search-params';

export const LanguageSwitcher = () => {
  const router = useRouter();
  const currentPathname = usePathname();
  const { stringifiedSearchParams } = useClientSearchParams();

  const { t, i18n } = useTranslation('common');

  const currentLanguage = useMemo(() => i18n.language, [i18n.language]);

  const handleValueChange = useCallback(
    (language: string) => {
      if (currentLanguage === i18nConfig.defaultLocale) {
        router.push(`/${language}${currentPathname}${stringifiedSearchParams}`);
      } else {
        router.push(
          `${currentPathname.replace(`/${currentLanguage}`, `/${language}`)}${stringifiedSearchParams}`,
        );
      }
    },
    [currentLanguage, currentPathname, router, stringifiedSearchParams],
  );

  if (i18nConfig.locales.length <= 1 || !i18n.language) {
    return null;
  }

  return (
    <li>
      <Select
        aria-label={t('header.language_select_label') as string}
        defaultValue={i18n.language}
        onValueChange={handleValueChange}
      >
        <SelectTrigger
          className="w-[150px]"
          aria-label={t('header.language_select_label')}
        >
          <div className="flex items-center gap-1 overflow-hidden">
            <LanguagesIcon className="size-4" />
            <SelectValue placeholder={t('header.language_select_label')} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {i18nConfig.locales.map((locale: string) => {
            const languageNames = new Intl.DisplayNames([currentLanguage], {
              type: 'language',
            });

            return (
              <SelectItem key={locale} value={locale}>
                {languageNames.of(locale)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </li>
  );
};
