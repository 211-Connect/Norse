import { Card, Flex, Grid, Text, Title } from '@mantine/core';
import Image from 'next/image';
import Link from 'next/link';
import { useAppConfig } from '../lib/hooks/use-app-config';
import { useTranslation } from 'next-i18next';

export function DataProviders() {
  const appConfig = useAppConfig();
  const { t } = useTranslation();

  return (
    <>
      {appConfig.providers.length > 0 && (
        <>
          <Flex
            maw="1200px"
            m="0 auto"
            pt="xl"
            pb="xl"
            pl="md"
            pr="md"
            direction="column"
          >
            <Title size="h3" order={3} color="primary" mb="md" align="center">
              {t('data_providers.provided_by')}
            </Title>

            <Grid justify="center">
              {appConfig.providers.map((el: any) => (
                <Grid.Col key={el.name} lg={3} md={4} sm={6} xs={12}>
                  <Card
                    component={Link}
                    href={el.href}
                    target="_blank"
                    p="lg"
                    radius="md"
                    shadow="sm"
                    withBorder
                    sx={{
                      height: '100%',
                      justifyContent: 'center',
                      alignItems: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Text size="lg" fw="bold" color="primary">
                      {el.name}
                    </Text>
                    <Card.Section p="lg">
                      <Image
                        src={el.logo}
                        alt=""
                        width={200}
                        height={0}
                        style={{ width: '200px', height: 'auto' }}
                      />
                    </Card.Section>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Flex>
        </>
      )}
    </>
  );
}
