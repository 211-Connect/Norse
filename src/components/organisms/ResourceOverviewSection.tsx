import { parseHtml } from '../../lib/utils/parseHtml';
import {
  useMantineTheme,
  Card,
  Title,
  Divider,
  Group,
  Badge,
  MediaQuery,
  Stack,
  Text,
} from '@mantine/core';
import { IconPhone, IconWorldWww, IconNavigation } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useCookies } from 'react-cookie';
import { ReferralButton } from '../atoms/ReferralButton';
import {
  USER_PREF_COORDS,
  USER_PREF_LOCATION,
} from '../../lib/constants/cookies';
import { useAppConfig } from '../../lib/hooks/useAppConfig';
import { openContextModal } from '@mantine/modals';

type Props = {
  id: string;
  displayName: string;
  displayPhoneNumber: string;
  serviceName: string;
  serviceDescription: string;
  attribution?: string;
  website: string;
  phoneNumbers: {
    number: string;
    rank: number;
  }[];
  lastAssuredOn: string;
  location: {
    coordinates: [number, number];
  };
  categories: {
    code: string;
    name: string;
  }[];
};

export function ResourceOverviewSection(props: Props) {
  const theme = useMantineTheme();
  const [cookies] = useCookies();
  const [coords, setCoords] = useState<any>(null);
  const config = useAppConfig();

  useEffect(() => {
    if (cookies[USER_PREF_COORDS] && cookies[USER_PREF_LOCATION]) {
      setCoords(cookies[USER_PREF_COORDS].split(',').reverse().join(','));
    }
  }, [cookies]);

  const { t } = useTranslation('page-resource');

  const handleDirectionsClick = (e: any) => {
    if (coords?.length === 0 || !coords) {
      e.preventDefault();
      openContextModal({
        modal: 'update-location',
        centered: true,
        innerProps: {
          location: props.location,
        },
      });
    }
  };

  return (
    <Card
      id={props.id}
      shadow="sm"
      p="lg"
      radius="md"
      withBorder
      sx={{
        outlineColor: theme.colors.secondary[theme.other.secondaryShade],
      }}
    >
      <Title mt="sm" size="h3" order={3} color="primary">
        {props.displayName}
      </Title>
      <Text color="primary" size="lg">
        {props.serviceName}
      </Text>

      <Text mb="lg" sx={{ whiteSpace: 'pre-wrap' }}>
        {parseHtml(props.serviceDescription ?? '')}
      </Text>

      <Divider />

      {config?.pages?.resource?.hideCategories ? null : (
        <>
          <Title size="h4" mt="lg" mb="xs" order={3} color="primary">
            {t('categories_text', {
              ns: 'dynamic',
              defaultValue: t('categories'),
            })}
          </Title>
          <Group>
            {props.categories?.map((el: any) => {
              return (
                <Badge
                  key={el?.code}
                  component={Link}
                  href={`/search?query=${encodeURIComponent(
                    el?.code
                  )}&query_label=${encodeURIComponent(
                    el?.name
                  )}&query_type=taxonomy`}
                  sx={{
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    textTransform: 'initial',
                  }}
                >
                  {el?.name}
                </Badge>
              );
            })}
          </Group>
        </>
      )}

      {config?.pages?.resource?.hideLastAssured ? null : (
        <>
          <Title size="h4" mt="lg" order={3} color="primary">
            {t('last_assured_text', {
              ns: 'dynamic',
              defaultValue: t('last_assured'),
            })}
          </Title>
          <Text size="xs">{props.lastAssuredOn || t('unknown')}</Text>
        </>
      )}

      {config?.hideAttribution || props.attribution == null ? null : (
        <>
          <Title size="h4" mt="lg" order={3} color="primary">
            {t('data_providers.provided_by', {
              ns: 'common',
            })}
          </Title>
          <Text size="xs">{props.attribution || t('unknown')}</Text>
        </>
      )}

      <MediaQuery largerThan="md" styles={{ flexDirection: 'row' }}>
        <Stack mt="lg">
          <ReferralButton
            referralType="call_referral"
            resourceId={props.id}
            resource={props}
            fullWidth
            disabled={
              !props.displayPhoneNumber || props.displayPhoneNumber.length === 0
            }
            aria-disabled={
              !props.displayPhoneNumber || props.displayPhoneNumber.length === 0
            }
            href={`tel:${
              props.displayPhoneNumber &&
              props.displayPhoneNumber.length > 0 &&
              props.displayPhoneNumber
            }`}
            size="xs"
            leftIcon={<IconPhone size={theme.fontSizes.lg} />}
          >
            {t('call_to_action.call', { ns: 'common' })}
          </ReferralButton>

          <ReferralButton
            referralType="website_referral"
            resourceId={props.id}
            resource={props}
            fullWidth
            disabled={!props.website}
            aria-disabled={!props.website}
            href={props.website || ''}
            target="_blank"
            size="xs"
            leftIcon={<IconWorldWww size={theme.fontSizes.lg} />}
          >
            {t('call_to_action.view_website', { ns: 'common' })}
          </ReferralButton>

          <ReferralButton
            referralType="directions_referral"
            resourceId={props.id}
            resource={props}
            fullWidth
            target="_blank"
            href={`https://www.google.com/maps/dir/?api=1&origin=${coords}&destination=${(
              props?.location?.coordinates ?? []
            )
              .slice()
              .reverse()
              .join(',')}`}
            size="xs"
            leftIcon={<IconNavigation size={theme.fontSizes.lg} />}
            onClick={handleDirectionsClick}
          >
            {t('call_to_action.get_directions', { ns: 'common' })}
          </ReferralButton>
        </Stack>
      </MediaQuery>
    </Card>
  );
}
