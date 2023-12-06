import { Button, Group, Text } from '@mantine/core';
import { ContextModalProps } from '@mantine/modals';
import { useTranslation } from 'next-i18next';
import { LocationAutocomplete } from '../../molecules/LocationAutocomplete';
import { ReferralButton } from '../../atoms/ReferralButton';

type Props = ContextModalProps;

export function UpdateLocation(props: Props) {
  const { t } = useTranslation('common');

  return (
    <>
      <Text>What&apos;s your starting location?</Text>

      <LocationAutocomplete />

      <Group spacing={5} position="right">
        <Button
          variant="default"
          onClick={() => props.context.closeModal(props.id)}
        >
          {t('call_to_action.cancel')}
        </Button>
        {/* <ReferralButton
          referralType="directions_referral"
          resourceId={props.id}
          resource={props}
          fullWidth
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
          onClick={handleDirectionsClick}
        >
          {t('call_to_action.get_directions')}
        </ReferralButton> */}
      </Group>
    </>
  );
}
