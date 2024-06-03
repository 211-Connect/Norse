import { signOut, useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Anchor } from '@/components/anchor';
import { useAppConfig } from '@/hooks/use-app-config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useAuthPrompt from '@/hooks/use-auth-prompt';
import Icon from '../icon';
import { Heart, Home, LogOut, Menu } from 'lucide-react';

type Props = {
  fullWidth?: boolean;
};

export function AppHeader(props: Props) {
  const appConfig = useAppConfig();
  const session = useSession();
  const { t } = useTranslation('common');
  const router = useRouter();
  const { open: openAuthPrompt, AuthPrompt } = useAuthPrompt();

  const customHeaderItems: any[] = t('header', {
    ns: 'menus',
    returnObjects: true,
  });

  const menuItems = useMemo(() => {
    const items = [
      <Anchor key={0} href="/">
        <div className="flex items-center gap-1">
          <Home className="size-4" /> {t('header.home')}
        </div>
      </Anchor>,
      <Anchor
        key={1}
        href="/favorites"
        onClick={(e) => {
          if (session.status === 'unauthenticated') {
            e.preventDefault();
            openAuthPrompt();
          }
        }}
      >
        <div className="flex items-center gap-1">
          <Heart className="size-4" /> {t('header.favorites')}
        </div>
      </Anchor>,
    ];

    if (session.data) {
      items.push(
        <a
          href="#"
          key={2}
          onClick={() => {
            signOut({ redirect: true, callbackUrl: '/' });
          }}
        >
          <div className="flex items-center gap-1">
            <LogOut className="size-4" /> {t('header.log_out')}
          </div>
        </a>,
      );
    }

    if (customHeaderItems && customHeaderItems.length > 0) {
      customHeaderItems.forEach((el) => {
        items.push(
          <Anchor
            key={el.name}
            href={el.href}
            className="flex items-center gap-1"
          >
            {el.icon && <Icon name={el.icon} className="size-4" />}
            {el.name}
          </Anchor>,
        );
      });
    }

    if (appConfig?.contact?.feedbackUrl) {
      const currentUrl = new URL(appConfig?.contact?.feedbackUrl);
      const feedbackUrl = currentUrl.toString().split('?')[0];
      const urlParams = new URLSearchParams(currentUrl.searchParams);

      if (typeof window !== 'undefined') {
        urlParams.set('referring_url', window.location.href);
      }

      items.push(
        <Button
          key="feedback"
          className="feedback"
          onClick={(e) => {
            e.preventDefault();
            window.open(`${feedbackUrl}?${urlParams.toString()}`, '_blank');
          }}
          rel="noopener noreferrer"
        >
          {t('header.submit_feedback')}
        </Button>,
      );
    }

    if ((router?.locales?.length ?? 0) > 1) {
      items.push(
        <Select
          key="language"
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {router.locales.map((isoCode: string) => {
                const languageNames = new Intl.DisplayNames([router.locale], {
                  type: 'language',
                });

                return (
                  <SelectItem key={isoCode} value={isoCode}>
                    {languageNames.of(isoCode)}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>,
      );
    }

    return items;
  }, [
    appConfig?.contact?.feedbackUrl,
    router,
    session.data,
    t,
    session.status,
    openAuthPrompt,
    customHeaderItems,
  ]);

  return (
    <>
      <header className="bg-white">
        <div
          className={cn(
            props.fullWidth ? 'w-full' : 'container mx-auto',
            'flex h-[80px] items-center justify-between',
          )}
        >
          <Anchor href="/" aria-label={t('header.home') as string}>
            <img
              src={appConfig?.brand?.logoUrl}
              alt={t('header.home') as string}
              style={{
                height: 'auto',
                maxHeight: 64,
                maxWidth: '90%',
              }}
            />
          </Anchor>

          <div className="hidden items-center gap-4 md:flex">{menuItems}</div>

          <div className="md:hidden">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu />
                </Button>
              </DialogTrigger>

              <DialogContent className="z-50 h-screen w-screen max-w-screen-2xl rounded-none">
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  {menuItems}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      <AuthPrompt />
    </>
  );
}
