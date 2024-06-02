import {
  IconHeart,
  IconHome,
  IconLogout,
  IconMenu2,
} from '@tabler/icons-react';
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
        <div className="flex gap-1 items-center">
          <IconHome className="size-4" /> {t('header.home')}
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
        <div className="flex gap-1 items-center">
          <IconHeart className="size-4" /> {t('header.favorites')}
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
          <div className="flex gap-1 items-center">
            <IconLogout className="size-4" /> {t('header.log_out')}
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
            className="flex gap-1 items-center"
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
            props.fullWidth
              ? 'w-full 2xl:pl-4 2xl:pr-4'
              : 'container mx-auto 2xl:pl-0 2xl:pr-0',
            'h-[80px] flex items-center justify-between pl-4 pr-4',
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

          <div className="items-center gap-4 hidden md:flex">{menuItems}</div>

          <div className="md:hidden">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <IconMenu2 />
                </Button>
              </DialogTrigger>

              <DialogContent className="w-screen h-screen max-w-screen-2xl rounded-none z-50">
                <div className="flex flex-col items-center justify-center gap-2 h-full">
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
