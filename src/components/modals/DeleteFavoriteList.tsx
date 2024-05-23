import { Button, Group, Text } from '@mantine/core';
import { ContextModalProps } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import { IconInfoCircle, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { FavoriteAdapter } from '../../lib/adapters/FavoriteAdapter';

type Props = ContextModalProps<{ name: string; id: string }>;

export function DeleteFavoriteList(props: Props) {
  const { t } = useTranslation('common');
  const router = useRouter();

  const onConfirm = async () => {
    try {
      const favoritesAdapter = new FavoriteAdapter();
      await favoritesAdapter.deleteFavoriteList(props.innerProps.id);

      showNotification({
        title: `${name} ${t('message.list_deleted', { ns: 'common' })}`,
        message: t('message.list_deleted_success', { ns: 'common' }),
        color: 'green',
        icon: <IconTrash />,
      });

      props.context.closeModal(props.id);

      router.replace('/favorites');
    } catch (err) {
      console.log(err);

      showNotification({
        title: t('message.error', { ns: 'common' }),
        message: t('message.list_not_deleted_error', { ns: 'common' }),
        icon: <IconInfoCircle />,
        color: 'red',
      });

      props.context.closeModal(props.id);
    }
  };

  return (
    <>
      <Text>
        {t('call_to_action.delete')} {props.innerProps.name}?
      </Text>
      <Group spacing={5} position="right">
        <Button
          variant="default"
          onClick={() => props.context.closeModal(props.id)}
        >
          {t('call_to_action.cancel')}
        </Button>
        <Button onClick={onConfirm}>{t('call_to_action.delete')}</Button>
      </Group>
    </>
  );
}
