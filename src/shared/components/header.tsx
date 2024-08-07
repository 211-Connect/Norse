import { signOut, useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { Fragment, useMemo } from 'react';
import { useAppConfig } from '../../lib/hooks/useAppConfig';
import { openContextModal } from '@mantine/modals';
import { Link } from './ui/link';
import { useDisclosure } from '../hooks/use-disclosure';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import {
  AlignJustifyIcon,
  HeartIcon,
  HomeIcon,
  LanguagesIcon,
  LogOutIcon,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

type Props = {
  fullWidth?: boolean;
};

export function Header(props: Props) {
  const [opened, { toggle }] = useDisclosure(false);
  const appConfig = useAppConfig();
  const session = useSession();
  const { t } = useTranslation('common');
  const router = useRouter();

  const SITEMAP = useMemo(
    () => [
      <li key="0">
        <Link href="/" className="flex items-center gap-1">
          <HomeIcon className="size-4" />
          {t('header.home')}
        </Link>
      </li>,

      <li key="1">
        <Link
          href="/favorites"
          className="flex items-center gap-1"
          onClick={(e) => {
            if (session.status === 'unauthenticated') {
              e.preventDefault();
              openContextModal({
                title: t('modal.prompt_auth'),
                modal: 'prompt-auth',
                centered: true,
                size: 320,
                innerProps: {},
              });
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
              onClick={(e) => {
                e.preventDefault();

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
        {(router?.locales?.length ?? 0) > 1 && router?.locale != null && (
          <li>
            <Select
              aria-label={t('header.language_select_label') as string}
              defaultValue={router.locale}
              onValueChange={(value) => {
                if (value) {
                  router.push(router.asPath, router.asPath, {
                    locale: value,
                  });
                }
              }}
            >
              <SelectTrigger className="w-[150px]">
                <div className="flex gap-1 items-center overflow-hidden">
                  <LanguagesIcon className="size-4" />
                  <SelectValue
                    placeholder={t('header.language_select_label')}
                  />
                </div>
              </SelectTrigger>
              <SelectContent>
                {router.locales.map((locale) => {
                  const languageNames = new Intl.DisplayNames([router.locale], {
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
        )}
      </Fragment>,
      <Fragment key="4">
        {session.status === 'authenticated' && (
          <Button
            variant="link"
            onClick={() => {
              signOut({ redirect: true, callbackUrl: '/' });
            }}
          >
            <LogOutIcon className="size-4" /> {t('header.log_out')}
          </Button>
        )}
      </Fragment>,
    ],
    [session.status, t, router, appConfig]
  );

  return (
    <header style={{ backgroundColor: '#fff' }}>
      <div
        className={cn(
          props.fullWidth ? '100%' : 'container mx-auto',
          'h-20 flex justify-between items-center'
        )}
      >
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

        <nav className="hidden lg:flex">
          <ul className="flex gap-4 items-center">{SITEMAP}</ul>
        </nav>

        <Sheet open={opened} onOpenChange={toggle}>
          <SheetTrigger
            className="lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <AlignJustifyIcon className="size-8" />
          </SheetTrigger>
          <SheetContent side="left">
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
            <ul className="flex flex-col gap-2 pt-4">{SITEMAP}</ul>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
