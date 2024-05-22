import { Button, Group, Text } from '@mantine/core';
import { ContextModalProps } from '@mantine/modals';
import { useTranslation } from 'next-i18next';
import {
  LocationAutocomplete,
  useLocationStore,
} from '../../molecules/location-autocomplete';
import { ReferralButton } from '@/components/referral-button';

type Props = ContextModalProps<{ location: { coordinates: string } }>;

export function UpdateLocation(props: Props) {
  const { t } = useTranslation('common');
  const coords = useLocationStore((state) => state.coords);

  return (
    <>
      <Text>{t('update_location.prompt_start_location')}</Text>

      <LocationAutocomplete />

      <Group spacing={5} position="right">
        <Button
          variant="default"
          onClick={() => props.context.closeModal(props.id)}
        >
          {t('call_to_action.cancel')}
        </Button>
        <ReferralButton
          referralType="directions_referral"
          resourceId={props.id}
          resource={props}
          target="_blank"
          href={`https://www.google.com/maps/dir/?api=1&origin=${coords
            .split(',')
            .reverse()
            .join(',')}&destination=${
            props?.innerProps?.location?.coordinates
              ? Array.from(props?.innerProps?.location?.coordinates)
                  .reverse()
                  .join(',')
              : ''
          }`}
          size="xs"
        >
          {t('call_to_action.get_directions')}
        </ReferralButton>
      </Group>
    </>
  );
}
