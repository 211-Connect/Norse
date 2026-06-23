'use client';

import { LanguagesIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTopLoader } from 'nextjs-toploader';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppConfig } from '../hooks/use-app-config';
import { useBreakpoint } from '../hooks/use-breakpoint';
import { useClientSearchParams } from '../hooks/use-client-search-params';
import {
  LANGUAGE_SWITCHER_CONTENT_ID,
  LANGUAGE_SWITCHER_TRIGGER_ID,
} from '../lib/aria-constants';
import { getLanguageName } from '../lib/language-names';
import { UmamiEvent, trackUmamiEvent } from '../lib/umami';
import { cn } from '../lib/utils';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export const LanguageSwitcher = () => {
  const appConfig = useAppConfig();
  const router = useRouter();
  const currentPathname = usePathname();
  const { stringifiedSearchParams } = useClientSearchParams();
  const { start } = useTopLoader();
  const isSmOrLarger = useBreakpoint(640);

  const { t, i18n } = useTranslation('common');

  const currentLanguage = useMemo(() => i18n.language, [i18n.language]);

  const newLayoutEnabled = useMemo(
    () => appConfig?.newLayout?.enabled,
    [appConfig],
  );

  const handleValueChange = useCallback(
    (language: string) => {
      if (language !== currentLanguage) {
        trackUmamiEvent(UmamiEvent.LanguageSwitch, {
          destinationLanguage: language,
        });
      }

      start();
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
      start,
      router,
      stringifiedSearchParams,
    ],
  );

  if (appConfig.i18n.locales.length <= 1 || !i18n.language) {
    return null;
  }

  return (
    <li className="h-full">
      <Select
        a11yLabel={
          <Label htmlFor={LANGUAGE_SWITCHER_TRIGGER_ID} className="sr-only">
            {t('header.language_select_label')}
          </Label>
        }
        contentId={LANGUAGE_SWITCHER_CONTENT_ID}
        defaultValue={i18n.language}
        onValueChange={handleValueChange}
      >
        <SelectTrigger
          id={LANGUAGE_SWITCHER_TRIGGER_ID}
          className={cn(
            'flex border-input h-full w-auto min-w-36 cursor-pointer items-center gap-1',
            newLayoutEnabled && 'bg-white!',
          )}
        >
          <div className="flex items-center gap-1 overflow-hidden">
            <LanguagesIcon className="size-4" aria-hidden="true" />
            <SelectValue placeholder={t('header.language_select_label')}>
              <span className="text-xs leading-5 font-medium capitalize">
                {getLanguageName(currentLanguage)}
              </span>
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent align={isSmOrLarger ? 'end' : 'start'}>
          {appConfig.i18n.locales.map((locale: string) => {
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
    </li>
  );
};
