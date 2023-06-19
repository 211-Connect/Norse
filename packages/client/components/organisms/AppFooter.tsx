import {
  Box,
  Divider,
  Flex,
  Group,
  MediaQuery,
  Stack,
  Text,
  useMantineTheme,
} from '@mantine/core';
import { Fragment, PropsWithChildren } from 'react';
import { useTranslation } from 'next-i18next';
import { Anchor } from '../atoms/Anchor';
import { useAppConfig } from '../../lib/hooks/useAppConfig';
import { IconPointFilled } from '@tabler/icons-react';

type Props = PropsWithChildren & {
  fullWidth?: boolean;
};

export function AppFooter(props: Props) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');
  const theme = useMantineTheme();

  return (
    <Box bg="#fff">
      <Divider />

      {props.children}

      <footer>
        <Flex
          maw={props.fullWidth ? '100%' : '1200px'}
          m="0 auto"
          pt="sm"
          pb="sm"
          pl="md"
          pr="md"
        >
          <MediaQuery
            smallerThan="xs"
            styles={{ flexDirection: 'column', alignItems: 'center' }}
          >
            <Stack align="center" justify="center" spacing="xs" w="100%">
              <Text size="sm">
                &copy; {new Date().getFullYear()} {appConfig.brand.name}.{' '}
                {t('footer.copyright')}
              </Text>

              <Group spacing="xs" position="center">
                <Anchor href="/legal/privacy-policy">
                  {t('footer.privacy_policy')}
                </Anchor>

                {appConfig.menus.footer.map(
                  (el: { name: string; href: string }) => (
                    <Fragment key={el.name}>
                      <IconPointFilled size={theme.fontSizes.sm} />
                      <Anchor
                        href={el.href}
                        display="flex"
                        sx={{ alignItems: 'center' }}
                      >
                        {el.name}
                      </Anchor>
                    </Fragment>
                  )
                )}
              </Group>
            </Stack>
          </MediaQuery>
        </Flex>
      </footer>
    </Box>
  );
}
