import { Grid, Stack, Title, useMantineTheme } from '@mantine/core';
import { Category } from '../molecules/Category';
import { useTranslation } from 'next-i18next';
import { useAppConfig } from '../../lib/hooks/useAppConfig';

export function CategorySection() {
  const appConfig = useAppConfig();
  const theme = useMantineTheme();
  const { t } = useTranslation('page-home');

  if ((appConfig?.categories?.length ?? 0) === 0) return null;

  return (
    <Stack
      p="lg"
      pb="xl"
      pt="xl"
      maw="1200px"
      m="0 auto"
      className="categories"
      spacing="xs"
    >
      <Title color="primary" mb="lg" order={3} size="h2">
        {t('categories_title')}
      </Title>

      <Grid gutter="xl">
        {appConfig.categories.map((el: any, idx) => (
          <Grid.Col key={el.name} lg={3} md={4} sm={6} xs={12}>
            <Category theme={theme} index={idx} {...el} />
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
}
