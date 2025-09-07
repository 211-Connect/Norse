'use client';

import { signOut, useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { Fragment, useMemo } from 'react';
import { Link } from './link';
import { useDisclosure } from '../hooks/use-disclosure';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import {
  AlignJustifyIcon,
  HeartIcon,
  HomeIcon,
  LogOutIcon,
} from 'lucide-react';
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
import { useSetAtom } from 'jotai';
import { dialogsAtom } from '../store/dialogs';
import { LanguageSwitcher } from './language-switcher';

type Props = {
  fullWidth?: boolean;
};

export function Header(props: Props) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');

  const session = useSession();
  const setDialogStore = useSetAtom(dialogsAtom);
  const [opened, { toggle }] = useDisclosure(false);

  const SITEMAP = useMemo(
    () => [
      <li key="0">
        <Link href="/" className="flex items-center gap-1 hover:underline">
          <HomeIcon className="size-4" />
          {t('header.home')}
        </Link>
      </li>,

      <li key="1">
        <Link
          href="/favorites"
          className="flex items-center gap-1 hover:underline"
          onClick={(e) => {
            if (session.status === 'unauthenticated') {
              e.preventDefault();
              setDialogStore((prev) => ({
                ...prev,
                promptAuth: {
                  ...prev.promptAuth,
                  open: true,
                },
              }));
            }
          }}
        >
          <HeartIcon className="size-4" />
          {t('header.favorites')}
        </Link>
      </li>,
      <Fragment key="5">
        {appConfig?.menus?.header &&
          appConfig.menus.header.length > 0 &&
          appConfig.menus.header.map((item) => {
            if (item.href == null) return;

            return (
              <li key={item.name}>
                <Link
                  className="hover:underline"
                  target={item.target}
                  {...(item.href != null ? { href: item.href } : { href: '' })}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
      </Fragment>,
      <Fragment key="2">
        {appConfig?.contact?.feedbackUrl && (
          <li>
            <Button
              key="feedback"
              className="feedback"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();

                if (!appConfig?.contact?.feedbackUrl) {
                  return;
                }

                const currentUrl = new URL(appConfig?.contact?.feedbackUrl);
                const feedbackUrl = currentUrl.toString().split('?')[0];
                const urlParams = new URLSearchParams(currentUrl.searchParams);

                if (typeof window !== 'undefined') {
                  urlParams.set('referring_url', window.location.href);
                }

                window.open(`${feedbackUrl}?${urlParams.toString()}`, '_blank');
              }}
            >
              {t('header.submit_feedback')}
            </Button>
          </li>
        )}
      </Fragment>,
      <Fragment key="3">
        <LanguageSwitcher />
      </Fragment>,
      <Fragment key="4">
        {session.status === 'authenticated' && (
          <li>
            <Button
              variant="ghost"
              className="flex gap-1"
              onClick={() => {
                signOut({ redirect: true, callbackUrl: '/' });
              }}
            >
              <LogOutIcon className="size-4" /> {t('header.log_out')}
            </Button>
          </li>
        )}
      </Fragment>,
    ],
    [session.status, t, appConfig, setDialogStore],
  );

  return (
    <header id={HEADER_ID} className="border-b bg-white print:hidden">
      <div
        className={cn(
          props.fullWidth ? '100%' : 'container mx-auto',
          'flex h-12 items-center justify-between md:h-20',
        )}
      >
        <div className="flex max-h-full w-full max-w-96 pb-1 pt-1 md:pb-2 md:pt-2">
          <Link
            href="/"
            aria-label={t('header.home') as string}
            className="max-h-full pb-1 pt-1 md:pb-2 md:pt-2"
          >
            <img
              src={appConfig?.brand?.logoUrl}
              alt={t('header.home') as string}
              className="max-h-full w-auto"
            />
          </Link>
        </div>

        <nav className="hidden w-full justify-end lg:flex">
          <ul className="flex items-center gap-4">{SITEMAP}</ul>
        </nav>

        <div className="flex w-full justify-end lg:hidden">
          <Sheet open={opened} onOpenChange={toggle}>
            <SheetTrigger aria-label="Toggle navigation menu">
              <AlignJustifyIcon className="size-8" />
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
              <ul className="flex flex-col gap-2 pt-4">{SITEMAP}</ul>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
