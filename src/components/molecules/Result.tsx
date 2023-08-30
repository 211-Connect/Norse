import { useEventStore } from '../../lib/hooks/useEventStore';
import {
  Badge,
  Card,
  Title,
  Text,
  Group,
  Button,
  Spoiler,
  MediaQuery,
  Stack,
  ActionIcon,
  Tooltip,
  MantineTheme,
  Indicator,
} from '@mantine/core';
import { openContextModal } from '@mantine/modals';
import {
  IconHeart,
  IconLink,
  IconMapPin,
  IconNavigation,
  IconPhone,
  IconWorldWww,
} from '@tabler/icons-react';
import Link from 'next/link';
import { NextRouter } from 'next/router';
import { parseHtml } from '../../lib/utils/parseHtml';
import { useTranslation } from 'next-i18next';
import { Anchor } from '../atoms/Anchor';
import { ReferralButton } from '../atoms/ReferralButton';
import { distanceBetweenCoordsInMiles } from '../../lib/utils/distenceBetweenCoords';

type Props = {
  id: string;
  serviceName: string;
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  website?: string;
  coordinates: string;
  sessionStatus: 'authenticated' | 'loading' | 'unauthenticated';
  theme: MantineTheme;
  router: NextRouter;
  location: {
    coordinates: [number, number];
  };
};

export function Result(props: Props) {
  const { createLinkEvent } = useEventStore();
  const { t } = useTranslation('common');

  const handleLink = (e: any) => {
    createLinkEvent(e);
  };

  const distance =
    props?.location?.coordinates && props?.coordinates
      ? distanceBetweenCoordsInMiles(
          props.coordinates
            .split(',')
            .map((c) => parseFloat(c))
            .reverse() as [number, number],
          props.location.coordinates
        )
      : null;

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
      <Title mt="sm" size="h4" order={3}>
        <Anchor
          href={`/search/${props.id}`}
          color="primary"
          onClick={handleLink}
        >
          {props.name}
        </Anchor>
      </Title>

      <Spoiler
        maxHeight={130}
        hideLabel={t('call_to_action.show_less', { ns: 'common' })}
        showLabel={t('call_to_action.show_more', { ns: 'common' })}
        styles={{
          control: {
            color:
              props.theme.colors.primary[props.theme.primaryShade as number],
          },
        }}
      >
        <Text>{parseHtml(props.description ?? '')}</Text>
      </Spoiler>

      <Stack mt="lg" mb="lg" spacing="sm">
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
              {props.address} {distance && `- ${distance}mi`}
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

        {props.phone && (
          <Group>
            <IconPhone
              color={
                props.theme.colors.secondary[props.theme.other.secondaryShade]
              }
            />

            <Badge sx={{ textTransform: 'initial' }}>{props.phone}</Badge>
          </Group>
        )}
      </Stack>

      <MediaQuery largerThan="lg" styles={{ flexDirection: 'row' }}>
        <Stack>
          <ReferralButton
            referralType="call_referral"
            resourceId={props.id}
            resource={props}
            fullWidth
            disabled={!props.phone}
            aria-disabled={!props.phone}
            href={`tel:${props.phone}`}
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
            disabled={
              props?.location?.coordinates == null || !props.coordinates
            }
            aria-disabled={
              props?.location?.coordinates == null || !props.coordinates
            }
            target="_blank"
            href={`https://www.google.com/maps/dir/?api=1&origin=${
              props.coordinates
            }&destination=${
              props?.location?.coordinates
                ? Array.from(props?.location?.coordinates).reverse().join(',')
                : ''
            }`}
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
          variant="light"
          component={Link}
          href={`/search/${props.id}`}
          size="xs"
          leftIcon={<IconLink />}
        >
          {t('call_to_action.view_details')}
        </Button>

        <ActionIcon
          ml="sm"
          variant="light"
          color="primary"
          size="md"
          aria-label={t('call_to_action.add_to_list')}
          onClick={() => {
            if (props.sessionStatus === 'unauthenticated') {
              openContextModal({
                title: t('modal.prompt_auth', { ns: 'common' }),
                modal: 'prompt-auth',
                centered: true,
                size: 320,
                innerProps: {},
              });
            } else if (props.sessionStatus === 'authenticated') {
              openContextModal({
                modal: 'add-to-favorites',
                centered: true,
                innerProps: {
                  serviceAtLocationId: props.id,
                },
              });
            }
          }}
        >
          <IconHeart />
        </ActionIcon>
      </Group>
    </Card>
  );
}
