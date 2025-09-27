import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { Fragment, useMemo, useState } from 'react';
import { Link } from './link';
import { useDisclosure } from '../hooks/use-disclosure';
import { Button } from './ui/button';
import {
  AlignJustifyIcon,
  ChevronDown,
  HomeIcon,
  LanguagesIcon,
  LogOut,
  Search,
  UserRound,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useAppConfig } from '../hooks/use-app-config';
import { HEADER_ID } from '../lib/constants';
import { useSetAtom } from 'jotai';
import { dialogsAtom } from '../store/dialogs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown';
import { Card, CardContent } from './ui/card';

export function Header() {
  const [opened, { toggle }] = useDisclosure(false);
  const appConfig = useAppConfig();
  const session = useSession();
  const { t } = useTranslation('common');
  const router = useRouter();
  const setDialogStore = useSetAtom(dialogsAtom);
  const [value, setValue] = useState(router.locale);

  const SITEMAP = useMemo(
    () => [
      <li key="0">
        <Link
          href={appConfig.header?.customHomeUrl || '/'}
          className="flex items-center gap-1 hover:underline"
        >
          <Button variant="outline" className="flex items-center gap-[5px]">
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
              <Button variant="outline" className="flex items-center gap-[5px]">
                <Search className="size-4" />
                {t('header.search')}
              </Button>
            </Link>
          </li>
        )}
      </Fragment>,
      <Fragment key="2">
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
                  <Button variant="outline">{item.name}</Button>
                </Link>
              </li>
            );
          })}
      </Fragment>,
      <Fragment key="3">
        {(router?.locales?.length ?? 0) > 1 && router?.locale != null && (
          <li>
            <Select
              aria-label={t('header.language_select_label') as string}
              defaultValue={router.locale}
              onValueChange={(value) => {
                if (value) {
                  setValue(value);
                  router.push(router.asPath, router.asPath, {
                    locale: value,
                  });
                }
              }}
            >
              <SelectTrigger
                className="flex min-w-[140px] items-center gap-[5px]"
                aria-label={t('header.language_select_label')}
              >
                <div className="flex items-center gap-[5px] overflow-hidden">
                  <LanguagesIcon className="size-4" />
                  <SelectValue placeholder={t('header.language_select_label')}>
                    <span className="capitalize">
                      {new Intl.DisplayNames([value], {
                        type: 'language',
                      }).of(value)}
                    </span>
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {router.locales.map((locale) => {
                  const languageNames = new Intl.DisplayNames([locale], {
                    type: 'language',
                  });

                  return (
                    <SelectItem key={locale} value={locale}>
                      <span className="capitalize">
                        {languageNames.of(locale)}
                      </span>
                      {` (${locale})`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </li>
        )}
      </Fragment>,
      <Fragment key="4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex items-center gap-[5px]" variant="outline">
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
              </CardContent>
            </Card>
          </DropdownMenuContent>
        </DropdownMenu>
      </Fragment>,
      <Fragment key="5">
        {appConfig?.safeExit?.enabled && (
          <li>
            <Link target="_blank" href={appConfig.safeExit.url}>
              <Button className="flex items-center gap-1" variant="outline">
                {appConfig.safeExit.text}
                <LogOut className="size-4" />
              </Button>
            </Link>
          </li>
        )}
      </Fragment>,
    ],
    [session.status, t, router, appConfig, setDialogStore, value],
  );

  return (
    <header id={HEADER_ID} className="border-b bg-white print:hidden">
      <div className="container flex items-center justify-between py-3 pl-3 pr-6">
        <div className="flex max-h-full w-full max-w-96">
          <Link
            href="/"
            aria-label={t('header.home') as string}
            className="max-h-full"
          >
            <img
              src={appConfig?.brand?.logoUrl}
              alt={t('header.home') as string}
              className="h-[80px] max-h-full w-auto"
            />
          </Link>
        </div>

        <nav className="hidden w-full justify-end lg:flex">
          <ul className="flex items-center gap-6">{SITEMAP}</ul>
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
