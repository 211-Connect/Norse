'use client';

import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';
import { useSetAtom } from 'jotai';
import {
  AlignJustifyIcon,
  Heart,
  HomeIcon,
  LogOut,
  Search,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTopLoader } from 'nextjs-toploader';

import { Link } from './link';
import { useDisclosure } from '../hooks/use-disclosure';
import { Button, buttonVariants } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { useAppConfig } from '../hooks/use-app-config';
import {
  HEADER_DESKTOP_ID,
  HEADER_ID,
  HEADER_MOBILE_ID,
  MAIN_CONTENT_ID,
  NEW_TAB_WARNING,
} from '../lib/constants';
import { dialogsAtom } from '../store/dialogs';
import { cn, withOptionalTrailingSlash } from '../lib/utils';
import { LanguageSwitcher } from './language-switcher';
import { ReportButton } from './report-button';
import { FontSizeToggle } from './accessibility/font-size-toggle';

export function Header() {
  const appConfig = useAppConfig();
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const pathname = usePathname();
  const { start } = useTopLoader();

  const session = useSession();
  const setDialogStore = useSetAtom(dialogsAtom);
  const [opened, { toggle }] = useDisclosure(false);

  const newLayoutEnabled = useMemo(
    () => appConfig?.newLayout?.enabled,
    [appConfig],
  );

  const logoUrl = useMemo(
    () =>
      newLayoutEnabled
        ? appConfig?.newLayout?.logoUrl
        : appConfig?.brand?.logoUrl,
    [
      appConfig?.brand?.logoUrl,
      appConfig?.newLayout?.logoUrl,
      newLayoutEnabled,
    ],
  );

  const currentPath = useMemo(() => {
    const normalizedPathname = pathname?.replace(/\/+$/, '') || '/';
    const localePrefix =
      i18n.language && i18n.language !== appConfig.i18n.defaultLocale
        ? `/${i18n.language}`
        : '';

    if (
      localePrefix &&
      (normalizedPathname === localePrefix ||
        normalizedPathname.startsWith(`${localePrefix}/`))
    ) {
      const localizedPath = normalizedPathname.slice(localePrefix.length);

      return localizedPath === '' ? '/' : localizedPath;
    }

    return normalizedPathname === '' ? '/' : normalizedPathname;
  }, [appConfig.i18n.defaultLocale, i18n.language, pathname]);

  const getAriaCurrent = useCallback(
    (href: string | null | undefined) => {
      if (!href || !href.startsWith('/')) {
        return undefined;
      }

      const normalizedHref = href.replace(/\/+$/, '') || '/';

      return currentPath === normalizedHref ? 'page' : undefined;
    },
    [currentPath],
  );

  const handleLogoClick = useCallback(() => {
    router.push(appConfig.header?.customHomeUrl || '/');
  }, [appConfig.header?.customHomeUrl, router]);

  const logoAlt = useMemo(() => {
    const brandName = appConfig.brand.name?.trim();

    return brandName ? `${brandName} home page` : (t('header.home') ?? 'Home');
  }, [appConfig.brand.name, t]);

  const favoritesButtonLabel = useMemo(() => {
    const customLabel = appConfig.header.favoritesButtonLabel?.trim();

    return customLabel || t('header.favorites');
  }, [appConfig.header.favoritesButtonLabel, t]);

  const sitemap = useMemo(
    () =>
      [
        <li key="0">
          <Link
            href={appConfig.header.customHomeUrl || '/'}
            aria-current={getAriaCurrent(appConfig.header.customHomeUrl || '/')}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'flex items-center gap-[5px]',
              newLayoutEnabled && '!bg-white',
            )}
          >
            <HomeIcon className="size-4" aria-hidden="true" />
            {t('header.home')}
          </Link>
        </li>,
        appConfig.header?.searchUrl ? (
          <li key="1">
            <Link
              href={appConfig.header.searchUrl}
              aria-current={getAriaCurrent(appConfig.header.searchUrl)}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'flex items-center gap-[5px]',
                newLayoutEnabled && '!bg-white',
              )}
            >
              <Search className="size-4" aria-hidden="true" />
              {t('header.search')}
            </Link>
          </li>
        ) : null,
        appConfig.accessibility.fontSize.allowedValues.length > 1 ? (
          <li key="2" className="hidden h-full sm:flex">
            <FontSizeToggle />
          </li>
        ) : null,
        appConfig.featureFlags.showFeedbackButtonGlobal ? (
          <li key="3">
            <ReportButton
              customText={t('header.report')}
              className={newLayoutEnabled ? '!bg-white' : undefined}
            />
          </li>
        ) : null,
        ...appConfig.header.customMenu
          .filter((item) => item.href != null)
          .map((item) => (
            <li key={item.name}>
              <Link
                target={item.openInNewTab ? '_blank' : undefined}
                aria-label={
                  item.openInNewTab
                    ? `${item.name}${NEW_TAB_WARNING}`
                    : item.name
                }
                aria-current={getAriaCurrent(item.href)}
                href={item.href ?? ''}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  newLayoutEnabled && '!bg-white',
                )}
              >
                {item.name}
                {item.openInNewTab && (
                  <span className="sr-only">{NEW_TAB_WARNING}</span>
                )}
              </Link>
            </li>
          )),
        <LanguageSwitcher key="5" />,
        <li key="6">
          <Button
            className={cn(
              'flex items-center gap-[5px]',
              newLayoutEnabled && '!bg-white',
            )}
            variant="outline"
            data-testid="favorites-btn"
            onClick={(event) => {
              if (session.status === 'unauthenticated') {
                const trigger = event.currentTarget as HTMLElement;
                setTimeout(() => {
                  setDialogStore((prev) => ({
                    ...prev,
                    promptAuth: {
                      ...prev.promptAuth,
                      open: true,
                      returnFocusTo: trigger,
                    },
                  }));
                });
              } else {
                start();
                router.push(withOptionalTrailingSlash('/favorites'));
              }
            }}
          >
            <Heart className="size-4" aria-hidden="true" />
            {favoritesButtonLabel}
          </Button>
        </li>,
        session.status === 'authenticated' ? (
          <li key="7">
            <Button
              className={cn(
                'flex items-center gap-[5px]',
                newLayoutEnabled && '!bg-white',
              )}
              variant="outline"
              onClick={() => {
                signOut({ redirect: true, callbackUrl: '/' });
              }}
            >
              <LogOut className="size-4" aria-hidden="true" />
              {t('header.log_out')}
            </Button>
          </li>
        ) : null,
        appConfig.header.safeExit?.enabled ? (
          <li key="8">
            <Link
              target={appConfig.header.safeExit.target}
              href={appConfig.header.safeExit?.url ?? '#'}
              aria-label={
                appConfig.header.safeExit.target === '_blank'
                  ? `${appConfig.header.safeExit?.text}${NEW_TAB_WARNING}`
                  : appConfig.header.safeExit?.text
              }
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'flex items-center gap-1',
              )}
            >
              {appConfig.header.safeExit?.text}
              <LogOut className="size-4" aria-hidden="true" />
              {appConfig.header.safeExit.target === '_blank' && (
                <span className="sr-only">{NEW_TAB_WARNING}</span>
              )}
            </Link>
          </li>
        ) : null,
      ].filter(Boolean),
    [
      appConfig.accessibility.fontSize.allowedValues.length,
      appConfig.header.customHomeUrl,
      appConfig.header.searchUrl,
      appConfig.header.customMenu,
      appConfig.header.safeExit?.enabled,
      appConfig.header.safeExit?.target,
      appConfig.header.safeExit?.url,
      appConfig.header.safeExit?.text,
      appConfig.featureFlags.showFeedbackButtonGlobal,
      newLayoutEnabled,
      t,
      favoritesButtonLabel,
      getAriaCurrent,
      session.status,
      setDialogStore,
      router,
      start,
    ],
  );

  return (
    <header
      id={HEADER_ID}
      className={cn(
        'z-[3] px-3 print:hidden',
        appConfig.header?.position === 'sticky' && 'sticky top-0',
        newLayoutEnabled ? 'py-[18px] lg:p-8' : 'border-b bg-white',
      )}
    >
      <div
        className={cn(
          'relative flex h-[104px] items-center justify-between gap-16 px-4 py-2 sm:gap-4 sm:px-6 sm:py-3',
          newLayoutEnabled &&
            'rounded-xl bg-gradient-to-r from-header-start to-header-end',
        )}
      >
        <div className="flex h-full items-center">
          <div
            className={cn(
              'flex h-full cursor-pointer items-center',
              newLayoutEnabled && 'absolute -left-4 -top-4',
            )}
            aria-label={logoAlt}
            onClick={handleLogoClick}
          >
            {logoUrl && (
              <Image
                src={logoUrl}
                alt={logoAlt}
                width={400}
                height={100}
                className="max-h-full w-auto object-contain lg:max-w-[400px]"
              />
            )}
          </div>
        </div>

        <nav
          id={HEADER_DESKTOP_ID}
          aria-label="Primary"
          className="z-[1] ml-auto hidden w-fit justify-end xl:flex"
        >
          <ul className="flex items-center gap-6 overflow-x-auto px-1 py-2 sm:px-2">
            {sitemap}
          </ul>
        </nav>

        <div
          id={HEADER_MOBILE_ID}
          className="flex w-full flex-1 justify-end xl:hidden"
        >
          <Sheet open={opened} onOpenChange={toggle}>
            <SheetTrigger
              aria-label="Toggle navigation menu"
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <AlignJustifyIcon
                className={cn('size-8', newLayoutEnabled && 'text-white')}
                aria-hidden="true"
              />
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>
                  <Link
                    href={appConfig.header?.customHomeUrl || '/'}
                    aria-label={logoAlt}
                  >
                    {logoUrl && (
                      <Image
                        src={logoUrl}
                        alt={logoAlt}
                        width={200}
                        height={64}
                        className="max-h-16 w-auto max-w-[200px] object-contain"
                      />
                    )}
                  </Link>
                </SheetTitle>
                <SheetDescription />
              </SheetHeader>
              <nav aria-label="Mobile primary">
                <a
                  href={`#${MAIN_CONTENT_ID}`}
                  className="sr-only rounded-md px-3 py-2 text-sm font-medium focus:not-sr-only focus:inline-flex focus:ring-2 focus:ring-ring"
                >
                  Skip to content
                </a>
                <ul className="flex flex-col items-start gap-2 pt-4">
                  {sitemap}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
