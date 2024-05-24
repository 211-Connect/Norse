import {
  Box,
  Button,
  Card,
  Flex,
  Group,
  Mark,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import { NextRouter } from 'next/router';
import { useAppConfig } from '../lib/hooks/useAppConfig';
import Link from 'next/link';
import { Anchor } from '@/components/anchor';
import { IconPhone } from '@tabler/icons-react';

type Props = {
  router: NextRouter;
  showAltSubtitle?: boolean;
};

export function NoResultsCard(props: Props) {
  const { t } = useTranslation('page-search');
  const config = useAppConfig() as any;
  const theme = useMantineTheme();

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Group align="center">
        <Image
          src="/undraw_searching.svg"
          width={0}
          height={150}
          alt=""
          style={{ height: '150px', width: 'auto' }}
        />
      </Group>

      <Title color="primary" order={3} align="center" mt="md" mb="md">
        {t('no_results.title')}{' '}
        <Mark>
          {props.router.query.query_label || props.router.query.query}
        </Mark>
      </Title>

      <Text align="center" color="dimmed">
        {!props.showAltSubtitle
          ? t('no_results.subtitle')
          : config?.contact?.number
          ? t('no_results.need_help')
          : t('no_results.alt_subtitle')}
      </Text>
      <Flex align="center" justify="center" mt="md">
        {config?.contact?.number && (
          <Button
            leftIcon={<IconPhone color={theme.colors.secondary[5]} />}
            href={`tel:${config.contact.number}`}
            component={Anchor}
          >
            {config.contact.number}
          </Button>
        )}
      </Flex>
    </Card>
  );
}
