'use client';

import { signOut, useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { Fragment, useCallback, useMemo } from 'react';
import { useSetAtom } from 'jotai';
import {
  AlignJustifyIcon,
  ChevronDown,
  HomeIcon,
  LogOut,
  Search,
  UserRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Link } from './link';
import { useDisclosure } from '../hooks/use-disclosure';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { useAppConfig } from '../hooks/use-app-config';
import { HEADER_ID } from '../lib/constants';
import { dialogsAtom } from '../store/dialogs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';
import { LanguageSwitcher } from './language-switcher';

export function Header() {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');
  const router = useRouter();

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

  const handleLogoClick = useCallback(() => {
    router.push(appConfig.header?.customHomeUrl || '/');
  }, [appConfig.header?.customHomeUrl, router]);

  const SITEMAP = useMemo(
    () => [
      <li key="0">
        <Link
          href={appConfig.header.customHomeUrl || '/'}
          className="flex items-center gap-1 hover:underline"
        >
          <Button
            variant="outline"
            className={cn(
              'flex items-center gap-[5px]',
              newLayoutEnabled && '!bg-white',
            )}
          >
            <HomeIcon className="size-4" />
            {t('header.home')}
          </Button>
        </Link>
      </li>,
      <Fragment key="1">
        {appConfig.header?.searchUrl && (
          <li>
            <Link
              href={appConfig.header.searchUrl}
              className="flex items-center gap-1 hover:underline"
            >
              <Button
                variant="outline"
                className={cn(
                  'flex items-center gap-[5px]',
                  newLayoutEnabled && '!bg-white',
                )}
              >
                <Search className="size-4" />
                {t('header.search')}
              </Button>
            </Link>
          </li>
        )}
      </Fragment>,
      <Fragment key="2">
        {appConfig.header.customMenu.length > 0 &&
          appConfig.header.customMenu.map((item) => {
            if (item.href == null) return;

            return (
              <li key={item.name}>
                <Link
                  className="hover:underline"
                  target={item.target ?? '_self'}
                  {...(item.href != null ? { href: item.href } : { href: '' })}
                >
                  <Button
                    variant="outline"
                    className={cn(newLayoutEnabled && '!bg-white')}
                  >
                    {item.name}
                  </Button>
                </Link>
              </li>
            );
          })}
      </Fragment>,
      <Fragment key="3">
        <LanguageSwitcher />
      </Fragment>,
      <Fragment key="4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className={cn(
                'flex items-center gap-[5px]',
                newLayoutEnabled && '!bg-white',
              )}
              variant="outline"
            >
              <UserRound className="size-4" />
              {t('header.my_stuff')}
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[143px]">
            <Card className="px-0 py-[10px]">
              <CardContent>
                <DropdownMenuItem className="!outline-none [&:focus-visible>*]:bg-accent">
                  <Button
                    className="w-full justify-start px-[10px] text-primary hover:text-primary"
                    variant="ghost"
                    onClick={() => {
                      if (session.status === 'unauthenticated') {
                        setTimeout(() => {
                          setDialogStore((prev) => ({
                            ...prev,
                            promptAuth: {
                              ...prev.promptAuth,
                              open: true,
                            },
                          }));
                        });
                      } else {
                        router.push('/favorites');
                      }
                    }}
                  >
                    {t('header.favorites')}
                  </Button>
                </DropdownMenuItem>
                {session.status === 'authenticated' && (
                  <DropdownMenuItem className="!outline-none [&:focus-visible>*]:bg-accent">
                    <Button
                      className="w-full justify-start px-[10px] text-primary hover:text-primary"
                      variant="ghost"
                      onClick={() => {
                        signOut({ redirect: true, callbackUrl: '/' });
                      }}
                    >
                      {t('header.log_out')}
                    </Button>
                  </DropdownMenuItem>
                )}
              </CardContent>
            </Card>
          </DropdownMenuContent>
        </DropdownMenu>
      </Fragment>,
      <Fragment key="5">
        {appConfig.header.safeExit?.enabled && (
          <li>
            <Link target="_blank" href={appConfig.header.safeExit?.url ?? '#'}>
              <Button className="flex items-center gap-1" variant="outline">
                {appConfig.header.safeExit?.text}
                <LogOut className="size-4" />
              </Button>
            </Link>
          </li>
        )}
      </Fragment>,
    ],
    [
      appConfig.header.customHomeUrl,
      appConfig.header.searchUrl,
      appConfig.header.customMenu,
      appConfig.header.safeExit?.enabled,
      appConfig.header.safeExit?.url,
      appConfig.header.safeExit?.text,
      newLayoutEnabled,
      t,
      session.status,
      setDialogStore,
      router,
    ],
  );

  return (
    <header
      id={HEADER_ID}
      className={cn(
        'sticky top-0 z-[3] px-3 print:hidden',
        newLayoutEnabled ? 'py-[18px] lg:p-8' : 'border-b bg-white',
      )}
    >
      <div
        className={cn(
          'relative flex h-[104px] items-center justify-between',
          newLayoutEnabled
            ? 'rounded-xl bg-gradient-to-r from-header-start to-header-end p-6'
            : 'py-3 pr-6',
        )}
      >
        <div
          className={cn(
            'flex',
            newLayoutEnabled
              ? 'absolute -left-3 -top-[18px]'
              : 'max-h-full w-full max-w-96',
          )}
        >
          <div
            className="cursor-pointer"
            aria-label={t('header.home') as string}
            onClick={handleLogoClick}
          >
            <img
              src={logoUrl}
              alt={t('header.home') as string}
              className="max-h-full w-auto"
            />
          </div>
        </div>

        <nav className="hidden w-full justify-end lg:flex">
          <ul className="flex items-center gap-6">{SITEMAP}</ul>
        </nav>

        <div className="flex w-full justify-end lg:hidden">
          <Sheet open={opened} onOpenChange={toggle}>
            <SheetTrigger aria-label="Toggle navigation menu">
              <AlignJustifyIcon
                className={cn('size-8', newLayoutEnabled && 'text-white')}
              />
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" aria-label={t('header.home') as string}>
                    <img
                      src={appConfig?.brand?.logoUrl}
                      alt={t('header.home') as string}
                      style={{
                        height: 'auto',
                        maxHeight: 64,
                        maxWidth: '90%',
                      }}
                    />
                  </Link>
                </SheetTitle>
                <SheetDescription />
              </SheetHeader>
              <ul className="flex flex-col items-start gap-2 pt-4">
                {SITEMAP}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
