import {
  USER_PREF_COORDS,
  USER_PREF_LOCATION,
} from '../../lib/constants/cookies';
import { parseHtml } from '../../lib/utils/parseHtml';
import {
  Card,
  Badge,
  Title,
  Spoiler,
  Stack,
  Group,
  MediaQuery,
  Button,
  ActionIcon,
  MantineTheme,
  Text,
  Tooltip,
} from '@mantine/core';
import { openContextModal } from '@mantine/modals';
import {
  IconMapPin,
  IconPhone,
  IconWorldWww,
  IconMail,
  IconCalendar,
  IconLanguage,
  IconNavigation,
  IconHeartMinus,
} from '@tabler/icons-react';
import { Anchor } from '../atoms/Anchor';
import { ReferralButton } from '../atoms/ReferralButton';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';

type Props = {
  id: string;
  displayName: string;
  serviceName: string;
  serviceDescription: string;
  website: string;
  email: string;
  phone: string;
  address: string | null;
  phoneNumbers: {
    number: string;
  }[];
  addresses: string[];
  location: {
    coordinates: number[];
  };
  hours: string;
  languages: string[];
  viewingAsOwner: boolean;
  theme: MantineTheme;
  favoriteListId: string;
};

export function Favorite(props: Props) {
  const [cookies] = useCookies();
  const [coords, setCoords] = useState(null);
  const { t } = useTranslation('common');

  useEffect(() => {
    if (cookies[USER_PREF_COORDS] && cookies[USER_PREF_LOCATION]) {
      setCoords(cookies[USER_PREF_COORDS].split(',').reverse().join(','));
    }
  }, [cookies]);

  return (
    <Card
      id={props.id}
      shadow="sm"
      p="lg"
      radius="md"
      withBorder
      sx={{
        overflow: 'initial',
        outlineColor:
          props.theme.colors.secondary[props.theme.other.secondaryShade],
      }}
    >
      {props.serviceName && (
        <Badge color={`secondary.${props.theme.other.secondaryShade}`}>
          {props.serviceName}
        </Badge>
      )}

      <Title mt="sm" size="h4" order={3} color="primary">
        <Anchor href={`/search/${props.id}`} color="primary">
          {props.displayName}
        </Anchor>
      </Title>

      <Spoiler maxHeight={50} hideLabel="Hide" showLabel="Show more">
        <Text>
          {parseHtml(props.serviceDescription, {
            parseLineBreaks: true,
          })}
        </Text>
      </Spoiler>

      <Stack mt="lg" spacing="sm">
        <Group noWrap>
          <IconMapPin
            color={
              props.theme.colors.secondary[props.theme.other.secondaryShade]
            }
          />

          {props.address ? (
            <Badge
              color="primary"
              sx={{
                textTransform: 'initial',
              }}
            >
              {props.address}
            </Badge>
          ) : (
            <Tooltip
              multiline
              withArrow
              label={t('search.confidential_address')}
              width={260}
              p="md"
            >
              <Badge
                sx={{
                  textTransform: 'initial',
                }}
              >
                {t('search.address_unavailable')}
              </Badge>
            </Tooltip>
          )}
        </Group>

        <Group>
          <IconPhone
            color={
              props.theme.colors.secondary[props.theme.other.secondaryShade]
            }
          />

          {props.phoneNumbers?.map((el: any) => (
            <Badge key={el._id}>
              <Anchor href={`tel:${el.number}`} color="primary">
                {el.number}
              </Anchor>
            </Badge>
          ))}
        </Group>

        {props.website && (
          <Group noWrap>
            <IconWorldWww
              color={
                props.theme.colors.secondary[props.theme.other.secondaryShade]
              }
            />
            <Badge
              component={Anchor}
              href={props.website}
              color="primary"
              target="_blank"
              sx={{
                textTransform: 'initial',
                cursor: 'pointer',
              }}
            >
              {props.website}
            </Badge>
          </Group>
        )}

        {props.email && (
          <Group noWrap>
            <IconMail
              color={
                props.theme.colors.secondary[props.theme.other.secondaryShade]
              }
            />
            <Badge sx={{ textTransform: 'initial' }}>
              <Anchor href={`mailto:${props.email}`} color="primary">
                {props.email}
              </Anchor>
            </Badge>
          </Group>
        )}

        {props.hours && (
          <Group noWrap>
            <IconCalendar
              color={
                props.theme.colors.secondary[props.theme.other.secondaryShade]
              }
            />

            <Badge sx={{ textTransform: 'initial' }}>{props.hours}</Badge>
          </Group>
        )}

        {props.languages instanceof Array && (
          <Group noWrap>
            <IconLanguage
              color={
                props.theme.colors.secondary[props.theme.other.secondaryShade]
              }
            />

            {props.languages.map((el: string) => (
              <Badge key={el} sx={{ textTransform: 'initial' }}>
                {el}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>

      <MediaQuery largerThan="md" styles={{ flexDirection: 'row' }}>
        <Stack mt="lg">
          <ReferralButton
            referralType="call_referral"
            resourceId={props.id}
            resource={props}
            fullWidth
            disabled={!props.phoneNumbers || props.phoneNumbers.length === 0}
            aria-disabled={
              !props.phoneNumbers || props.phoneNumbers.length === 0
            }
            href={`tel:${
              props.phoneNumbers &&
              props.phoneNumbers.length > 0 &&
              props?.phoneNumbers?.find((el: any) => el.rank === 1)?.number
            }`}
            size="xs"
            leftIcon={<IconPhone size={props.theme.fontSizes.lg} />}
          >
            {t('call_to_action.call')}
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
            leftIcon={<IconWorldWww size={props.theme.fontSizes.lg} />}
          >
            {t('call_to_action.view_website')}
          </ReferralButton>

          <ReferralButton
            referralType="directions_referral"
            resourceId={props.id}
            resource={props}
            fullWidth
            disabled={props?.location?.coordinates == null || !coords}
            aria-disabled={props?.location?.coordinates == null || !coords}
            target="_blank"
            href={`https://www.google.com/maps/dir/?api=1&origin=${coords}&destination=${Array.from(
              props?.location?.coordinates ?? []
            )
              .reverse()
              .join(',')}`}
            size="xs"
            leftIcon={<IconNavigation size={props.theme.fontSizes.lg} />}
          >
            {t('call_to_action.get_directions')}
          </ReferralButton>
        </Stack>
      </MediaQuery>

      <Group noWrap mt="md" spacing="sm">
        <Button
          fullWidth
          component={Link}
          variant="light"
          href={`/search/${props.id}`}
          size="xs"
        >
          {t('call_to_action.view_details')}
        </Button>

        {props.viewingAsOwner && (
          <ActionIcon
            ml="sm"
            variant="light"
            color="primary"
            aria-label={t('call_to_action.remove_from_list')}
            size="md"
            onClick={() => {
              openContextModal({
                modal: 'remove-from-list',
                centered: true,
                innerProps: {
                  id: props.id,
                  favoriteListId: props.favoriteListId,
                },
              });
            }}
          >
            <IconHeartMinus />
          </ActionIcon>
        )}
      </Group>
    </Card>
  );
}
