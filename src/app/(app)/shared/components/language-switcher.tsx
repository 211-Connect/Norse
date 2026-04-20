'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePathname, useRouter } from 'next/navigation';
import { useTopLoader } from 'nextjs-toploader';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { LanguagesIcon } from 'lucide-react';
import { useClientSearchParams } from '../hooks/use-client-search-params';
import { useAppConfig } from '../hooks/use-app-config';
import { useBreakpoint } from '../hooks/use-breakpoint';
import {
  LANGUAGE_SWITCHER_CONTENT_ID,
  LANGUAGE_SWITCHER_TRIGGER_ID,
} from '../lib/aria-constants';
import { cn } from '../lib/utils';

const LANGUAGE_NAME = {
  ff: 'Fulfulde',
  mww: 'Hmong',
  fj: 'Fijian',
  tl: 'Tagalog',
};

const getLanguageName = (locale: string) => {
  if (LANGUAGE_NAME[locale]) {
    return LANGUAGE_NAME[locale];
  }
  try {
    return new Intl.DisplayNames([locale], {
      type: 'language',
    }).of(locale);
  } catch (error) {
    return locale;
  }
};

export const LanguageSwitcher = () => {
  const appConfig = useAppConfig();
  const router = useRouter();
  const currentPathname = usePathname();
  const { stringifiedSearchParams } = useClientSearchParams();
  const { start } = useTopLoader();
  const isSmOrLarger = useBreakpoint(640);

  const { t, i18n } = useTranslation('common');
  const [open, setOpen] = useState(false);

  const currentLanguage = useMemo(() => i18n.language, [i18n.language]);

  const newLayoutEnabled = useMemo(
    () => appConfig?.newLayout?.enabled,
    [appConfig],
  );

  const handleValueChange = useCallback(
    (language: string) => {
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
      <Label htmlFor={LANGUAGE_SWITCHER_TRIGGER_ID} className="sr-only">
        {t('header.language_select_label')}
      </Label>
      {!open && (
        <div
          id={LANGUAGE_SWITCHER_CONTENT_ID}
          role="listbox"
          hidden
          aria-hidden="true"
        />
      )}
      <Select
        contentId={LANGUAGE_SWITCHER_CONTENT_ID}
        defaultValue={i18n.language}
        open={open}
        onOpenChange={setOpen}
        onValueChange={handleValueChange}
      >
        <SelectTrigger
          id={LANGUAGE_SWITCHER_TRIGGER_ID}
          className={cn(
            'flex h-full w-auto min-w-[140px] items-center gap-[5px]',
            newLayoutEnabled && '!bg-white',
          )}
        >
          <div className="flex items-center gap-1 overflow-hidden">
            <LanguagesIcon className="size-4" aria-hidden="true" />
            <SelectValue placeholder={t('header.language_select_label')}>
              <span className="text-xs font-medium capitalize leading-5">
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
