import { Button, Group } from '@mantine/core';
import { ContextModalProps } from '@mantine/modals';
import { useTranslation } from 'next-i18next';
import { signIn } from 'next-auth/react';

type Props = ContextModalProps;

export function PromptAuthModal(props: Props) {
  const { t } = useTranslation('common');

  return (
    <>
      <Group spacing={5} position="right">
        <Button
          variant="default"
          onClick={() => props.context.closeModal(props.id)}
        >
          {t('call_to_action.cancel')}
        </Button>
        <Button
          onClick={() =>
            signIn('keycloak', { callbackUrl: window.location.href })
          }
        >
          {t('call_to_action.login')}
        </Button>
      </Group>
    </>
  );
}
