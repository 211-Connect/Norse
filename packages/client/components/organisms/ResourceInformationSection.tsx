import { useAppConfig } from '../../lib/hooks/useAppConfig';
import {
  Card,
  MediaQuery,
  Flex,
  Grid,
  Group,
  ThemeIcon,
  Anchor,
  Text,
  useMantineTheme,
} from '@mantine/core';
import {
  IconMapPin,
  IconMailbox,
  IconPhone,
  IconPrinter,
  IconMail,
  IconWorldWww,
  IconClock,
  IconEdit,
  IconFolder,
  IconCheck,
  IconCurrencyDollar,
  IconLanguage,
  IconMap2,
} from '@tabler/icons-react';
import { PluginLoader } from '../molecules/PluginLoader';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';

type Props = {
  addresses: {
    type: string;
    address_1: string;
    city: string;
    state_province: string;
    postal_code: string;
    country: string;
  }[];
  phoneNumbers: {
    number: string;
    rank: number;
  }[];
  website: string;
  email: string;
  hours: string;
  languages: string[];
  applicationProcess: string;
  fees: string;
  requiredDocuments: string;
  eligibilities: string;
  serviceAreaDescription: string[];
  location: {
    coordinates: [number, number];
  };
  serviceArea: any;
};

export function ResourceInformationSection(props: Props) {
  const appConfig = useAppConfig();
  const theme = useMantineTheme();
  const { t } = useTranslation('page-resource');

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Card.Section>
        <MediaQuery query="print" styles={{ display: 'none' }}>
          <Flex
            w="100%"
            h="500px"
            mah="250px"
            mb="md"
            id="map-container"
            sx={(theme) => ({
              position: 'static',
              borderTopLeftRadius: theme.radius.md,
              borderTopRightRadius: theme.radius.md,
              overflow: 'hidden',
            })}
          >
            <Flex w="100%" h="100%">
              <PluginLoader
                plugin={appConfig?.features?.map?.plugin}
                component="map"
                locations={[props]}
              />
            </Flex>
          </Flex>
        </MediaQuery>
      </Card.Section>

      <Grid w="100%" gutter="lg">
        {props.addresses?.length > 0 &&
          props.addresses
            .sort((a: any, b: any) => a.rank - b.rank)
            .map((address: any, key) => {
              return (
                <Grid.Col key={key} lg={6} md={6} sm={12} xs={12}>
                  <Group spacing="xs">
                    <ThemeIcon size="xs" variant="default">
                      {address.type === 'physical' ? (
                        <IconMapPin />
                      ) : (
                        <IconMailbox />
                      )}
                    </ThemeIcon>

                    <Text weight={600}>
                      {address.type === 'physical' ? t('location') : t('mail')}
                    </Text>
                  </Group>
                  <Text size="xs">{`${address.address_1}, ${address.city}, ${address.stateProvince} ${address.postalCode}`}</Text>
                </Grid.Col>
              );
            })}

        {props.phoneNumbers?.length > 0 &&
          props.phoneNumbers
            .sort((a: any, b: any) => a.rank - b.rank)
            .map((phone: any) => {
              return (
                <Grid.Col key={phone.number} lg={6} md={6} sm={12} xs={12}>
                  <Group spacing="xs">
                    <ThemeIcon size="xs" variant="default">
                      {phone.type === 'fax' ? <IconPrinter /> : <IconPhone />}
                    </ThemeIcon>

                    <Text weight={600}>
                      {phone.type === 'fax' ? t('fax') : t('voice')}
                    </Text>
                  </Group>
                  {phone.type === 'voice' ? (
                    <Anchor
                      size="xs"
                      component={Link}
                      href={`tel:${phone.number}`}
                      sx={{
                        color: theme.colors.primary,
                      }}
                    >
                      {phone.number}
                    </Anchor>
                  ) : (
                    <Text size="xs">{phone.number}</Text>
                  )}
                </Grid.Col>
              );
            })}

        {props.email && (
          <Grid.Col lg={6} md={6} sm={12} xs={12}>
            <Group spacing="xs">
              <ThemeIcon size="xs" variant="default">
                <IconMail />
              </ThemeIcon>

              <Text weight={600}>{t('email')}</Text>
            </Group>
            <Anchor
              size="xs"
              component={Link}
              href={`mailto:${props.email}`}
              sx={{
                color: theme.colors.primary,
              }}
            >
              {props.email}
            </Anchor>
          </Grid.Col>
        )}

        {props.website && (
          <Grid.Col lg={6} md={6} sm={12} xs={12}>
            <Group spacing="xs">
              <ThemeIcon size="xs" variant="default">
                <IconWorldWww />
              </ThemeIcon>

              <Text weight={600}>{t('website')}</Text>
            </Group>
            <Anchor
              size="xs"
              component={Link}
              href={props.website}
              rel="noopener noreferrer"
              target="_blank"
              sx={{
                color: theme.colors.primary,
              }}
            >
              {props.website}
            </Anchor>
          </Grid.Col>
        )}

        {props.hours && (
          <Grid.Col lg={6} md={6} sm={12} xs={12}>
            <Group spacing="xs">
              <ThemeIcon size="xs" variant="default">
                <IconClock />
              </ThemeIcon>

              <Text weight={600}>{t('hours')}</Text>
            </Group>
            <Text size="xs">{props.hours}</Text>
          </Grid.Col>
        )}

        {props?.applicationProcess && (
          <Grid.Col lg={6} md={6} sm={12} xs={12}>
            <Group spacing="xs">
              <ThemeIcon size="xs" variant="default">
                <IconEdit />
              </ThemeIcon>

              <Text weight={600}>{t('application_process')}</Text>
            </Group>
            <Text size="xs">{props.applicationProcess}</Text>
          </Grid.Col>
        )}

        {props?.requiredDocuments && (
          <Grid.Col lg={6} md={6} sm={12} xs={12}>
            <Group spacing="xs">
              <ThemeIcon size="xs" variant="default">
                <IconFolder />
              </ThemeIcon>

              <Text weight={600}>{t('required_documents')}</Text>
            </Group>
            <Text size="xs">{props.requiredDocuments}</Text>
          </Grid.Col>
        )}

        {props?.eligibilities && (
          <Grid.Col lg={6} md={6} sm={12} xs={12}>
            <Group spacing="xs">
              <ThemeIcon size="xs" variant="default">
                <IconCheck />
              </ThemeIcon>

              <Text weight={600}>{t('eligibility')}</Text>
            </Group>

            <Text size="xs">{props.eligibilities}</Text>
          </Grid.Col>
        )}

        {props?.fees && (
          <Grid.Col lg={6} md={6} sm={12} xs={12}>
            <Group spacing="xs">
              <ThemeIcon size="xs" variant="default">
                <IconCurrencyDollar />
              </ThemeIcon>

              <Text weight={600}>{t('fee')}</Text>
            </Group>
            <Text size="xs">{props.fees}</Text>
          </Grid.Col>
        )}

        {props?.languages instanceof Array && (
          <Grid.Col lg={6} md={6} sm={12} xs={12}>
            <Group spacing="xs">
              <ThemeIcon size="xs" variant="default">
                <IconLanguage />
              </ThemeIcon>

              <Text weight={600}>{t('languages')}</Text>
            </Group>
            {props.languages.map((el: string) => (
              <Text key={el} size="xs">
                {el}
              </Text>
            ))}
          </Grid.Col>
        )}

        {props?.serviceAreaDescription && (
          <Grid.Col lg={6} md={6} sm={12} xs={12}>
            <Group spacing="xs">
              <ThemeIcon size="xs" variant="default">
                <IconMap2 />
              </ThemeIcon>

              <Text weight={600}>{t('service_area')}</Text>
            </Group>
            <Text size="xs">{props.serviceAreaDescription}</Text>
          </Grid.Col>
        )}
      </Grid>
    </Card>
  );
}
