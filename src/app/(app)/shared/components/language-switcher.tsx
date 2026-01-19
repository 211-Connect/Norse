'use client';

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePathname, useRouter } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { LanguagesIcon } from 'lucide-react';
import { useClientSearchParams } from '../hooks/use-client-search-params';
import { useAppConfig } from '../hooks/use-app-config';
import { cn } from '../lib/utils';

const LANGUAGE_NAME = {
  ff: 'Fulfulde',
  mww: 'Hmong',
};

export const LanguageSwitcher = () => {
  const appConfig = useAppConfig();
  const router = useRouter();
  const currentPathname = usePathname();
  const { stringifiedSearchParams } = useClientSearchParams();

  const { t, i18n } = useTranslation('common');

  const currentLanguage = useMemo(() => i18n.language, [i18n.language]);

  const newLayoutEnabled = useMemo(
    () => appConfig?.newLayout?.enabled,
    [appConfig],
  );

  const handleValueChange = useCallback(
    (language: string) => {
      if (currentLanguage === appConfig.i18n.defaultLocale) {
        router.push(`/${language}${currentPathname}${stringifiedSearchParams}`);
      } else {
        router.push(
          `${currentPathname?.replace(`/${currentLanguage}`, `/${language}`)}${stringifiedSearchParams}`,
        );
      }
    },
    [
      appConfig.i18n.defaultLocale,
      currentLanguage,
      currentPathname,
      router,
      stringifiedSearchParams,
    ],
  );

  if (appConfig.i18n.locales.length <= 1 || !i18n.language) {
    return null;
  }

  const languageNames = new Intl.DisplayNames(appConfig.i18n.locales, {
    type: 'language',
  });

  return (
    <li>
      <Select
        aria-label={t('header.language_select_label') as string}
        defaultValue={i18n.language}
        onValueChange={handleValueChange}
      >
        <SelectTrigger
          className={cn(
            'flex w-auto min-w-[140px] items-center gap-[5px]',
            newLayoutEnabled && '!bg-white',
          )}
          aria-label={t('header.language_select_label')}
        >
          <div className="flex items-center gap-1 overflow-hidden">
            <LanguagesIcon className="size-4" />
            <SelectValue placeholder={t('header.language_select_label')}>
              <span className="capitalize">
                {new Intl.DisplayNames([currentLanguage], {
                  type: 'language',
                }).of(currentLanguage)}
              </span>
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {appConfig.i18n.locales.map((locale: string) => {
            const languageName =
              LANGUAGE_NAME[locale] || languageNames.of(locale);

            return (
              <SelectItem key={locale} value={locale}>
                <span className="capitalize">{languageName}</span>
                {` (${locale})`}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </li>
  );
};
