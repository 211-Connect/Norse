'use client';

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
import { UmamiEvent, trackUmamiEvent } from '../lib/umami';
import { cn } from '../lib/utils';
import { LanguageSwitcherPrimitive } from './language-switcher-primitive';

export const LanguageSwitcher = () => {
  const appConfig = useAppConfig();
  const router = useRouter();
  const currentPathname = usePathname();
  const { stringifiedSearchParams } = useClientSearchParams();
  const { start } = useTopLoader();
  const isSmOrLarger = useBreakpoint(640);

  const { i18n } = useTranslation('common');

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
      <LanguageSwitcherPrimitive
        value={currentLanguage}
        onValueChange={handleValueChange}
        locales={appConfig.i18n.locales}
        triggerId={LANGUAGE_SWITCHER_TRIGGER_ID}
        contentId={LANGUAGE_SWITCHER_CONTENT_ID}
        align={isSmOrLarger ? 'end' : 'start'}
        triggerClassName={cn(newLayoutEnabled && 'bg-white!')}
      />
    </li>
  );
};
