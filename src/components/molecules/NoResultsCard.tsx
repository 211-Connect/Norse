import { Card, Group, Mark, Text, Title } from '@mantine/core';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import { NextRouter } from 'next/router';

type Props = {
  router: NextRouter;
  showAltSubtitle?: boolean;
};

export function NoResultsCard(props: Props) {
  const { t } = useTranslation('page-search');

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
          : t('no_results.alt_subtitle')}
      </Text>
    </Card>
  );
}
