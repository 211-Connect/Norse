import { parseHtml } from '$lib/utils/parseHtml';
import { Card, Text, Title, useMantineTheme } from '@mantine/core';
import { useTranslation } from 'next-i18next';

type Props = {
  organizationName: string;
  organizationDescription: string;
};

export function ResourceOrganizationSection(props: Props) {
  const theme = useMantineTheme();
  const { t } = useTranslation('page-resource');

  return (
    <Card
      shadow="sm"
      p="lg"
      radius="md"
      withBorder
      sx={{
        overflow: 'initial',
        outlineColor: theme.colors.secondary[theme.other.secondaryShade],
      }}
    >
      <Title size="h3" order={3} color="primary">
        {t('agency_info')}
      </Title>
      <Text size="md" color="primary">
        {props.organizationName}
      </Text>

      <Text>{parseHtml(props.organizationDescription ?? '')}</Text>
    </Card>
  );
}
