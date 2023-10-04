import {
  Burger,
  Button,
  Drawer,
  Group,
  MediaQuery,
  Select,
  Anchor as MantineAnchor,
  Stack,
  useMantineTheme,
} from '@mantine/core';
import {
  IconHeart,
  IconHome,
  IconLanguage,
  IconLogout,
} from '@tabler/icons-react';
import { signOut, useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import ISO from 'iso-639-1';
import { Anchor } from '../atoms/Anchor';
import { useAppConfig } from '../../lib/hooks/useAppConfig';
import { openContextModal } from '@mantine/modals';

type Props = {
  fullWidth?: boolean;
};

export function AppHeader(props: Props) {
  const [opened, setOpened] = useState(false);
  const appConfig = useAppConfig();
  const theme = useMantineTheme();
  const session = useSession();
  const { t } = useTranslation('common');
  const router = useRouter();

  const menuItems = useMemo(() => {
    const items = [
      <Anchor key={0} href="/">
        <Group spacing="xs">
          <IconHome size={theme.fontSizes.xl} /> {t('header.home')}
        </Group>
      </Anchor>,
      <Anchor
        key={1}
        href="/favorites"
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
        <Group spacing="xs">
          <IconHeart size={theme.fontSizes.xl} /> {t('header.favorites')}
        </Group>
      </Anchor>,
    ];

    if (session.data) {
      items.push(
        <MantineAnchor
          key={2}
          onClick={() => {
            signOut({ redirect: true, callbackUrl: '/' });
          }}
        >
          <Group spacing="xs">
            <IconLogout size={theme.fontSizes.xl} /> {t('header.log_out')}
          </Group>
        </MantineAnchor>
      );
    }

    if (appConfig?.menus?.header && appConfig.menus.header.length > 0) {
      appConfig.menus.header.forEach((el: { name: string; href: string }) => {
        items.push(
          <Anchor
            key={el.name}
            href={el.href}
            display="flex"
            sx={{ alignItems: 'center' }}
          >
            {el.name}
          </Anchor>
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
          component={Link}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.open(`${feedbackUrl}?${urlParams.toString()}`, '_blank');
          }}
          target="_blank"
          rel="noopener noreferrer"
          mr="md"
          ml="md"
          size="xs"
        >
          {t('header.submit_feedback')}
        </Button>
      );
    }

    if ((router?.locales?.length ?? 0) > 1) {
      items.push(
        <Select
          key="language"
          icon={<IconLanguage />}
          aria-label={t('header.language_select_label') as string}
          maw={150}
          defaultValue={router.locale}
          onChange={(value) => {
            if (value) {
              router.push(router.asPath, router.asPath, {
                locale: value,
              });
            }
          }}
          data={
            router.locales?.map((isoCode: string) => ({
              value: isoCode,
              label: ISO.getNativeName(isoCode),
            })) ?? []
          }
        />
      );
    }

    return items;
  }, [
    appConfig.contact.feedbackUrl,
    appConfig.menus.header,
    router,
    session.data,
    t,
    theme.fontSizes.xl,
    session.status,
  ]);

  return (
    <header style={{ backgroundColor: '#fff' }}>
      <Group
        maw={props.fullWidth ? '100%' : '1200px'}
        m="0 auto"
        position="apart"
        h="80px"
        pl="md"
        pr="md"
        noWrap
        align="center"
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

        <MediaQuery smallerThan="sm" styles={{ display: 'none' }}>
          <Group spacing="lg">{menuItems}</Group>
        </MediaQuery>

        <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
          <Group position="right" align="center">
            <Drawer opened={opened} onClose={() => setOpened(false)}>
              <Stack align="center">{menuItems}</Stack>
            </Drawer>

            <Burger
              opened={opened}
              onClick={() => setOpened((prev) => !prev)}
              mr="md"
            />
          </Group>
        </MediaQuery>
      </Group>
    </header>
  );
}
