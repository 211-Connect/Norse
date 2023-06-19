import { Card, Flex, Grid, Group, Text, Title } from '@mantine/core';
import Image from 'next/image';
import Link from 'next/link';
import { IconDatabase } from '@tabler/icons-react';
import { useAppConfig } from '../../lib/hooks/useAppConfig';
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
            pt="lg"
            pb="lg"
            pl="md"
            pr="md"
            direction="column"
          >
            <Title size="h3" order={3} color="primary" mb="md" underline>
              <Group spacing="sm">
                <IconDatabase /> {t('text:resources-provided-by')}
              </Group>
            </Title>

            <Grid>
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
