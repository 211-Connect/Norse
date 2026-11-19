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
import { AnalyticsEvent, AnalyticsTools, trackEvent } from '../lib/analytics';
import { localeSwitchHrefs } from '../lib/locale-switch';
import { cn, withOptionalCustomBasePath } from '../lib/utils';
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
    async (language: string) => {
      if (language === currentLanguage) return;
      trackEvent(AnalyticsEvent.LanguageSwitch, AnalyticsTools.Umami, {
        destinationLanguage: language,
      });

      start();
      const { href, pageLoadHref } = localeSwitchHrefs({
        pathname: currentPathname ?? '/',
        search: stringifiedSearchParams,
        from: currentLanguage,
        to: language,
        defaultLocale: appConfig.i18n.defaultLocale,
      });

      // Unprefixed paths take their language from the locale cookie, and the proxy only writes it on page
      // loads, so the choice is saved before navigating (docs/locale-routing.md).
      const saved = await fetch(withOptionalCustomBasePath('/api/locale'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale: language }),
      }).then(
        (response) => response.ok,
        () => false,
      );

      if (saved) {
        router.push(href);
      } else {
        window.location.assign(withOptionalCustomBasePath(pageLoadHref));
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
