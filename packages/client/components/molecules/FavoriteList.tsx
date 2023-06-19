import { FavoriteAdapter } from '../../lib/adapters/FavoriteAdapter';
import {
  Card,
  Group,
  Badge,
  ActionIcon,
  Title,
  Anchor,
  Divider,
  Button,
  Text,
} from '@mantine/core';
import { openConfirmModal, openContextModal } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import { IconEdit, IconInfoCircle, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import router from 'next/router';

type Props = {
  id: string;
  privacy: 'PRIVATE' | 'PUBLIC';
  name: string;
  description: string;
};

export function FavoriteList(props: Props) {
  const { t } = useTranslation('page-favorites');

  const deleteList = (id: string, name: string) => {
    return async () => {
      openConfirmModal({
        title: `${t('delete_list')} ${name}?`,
        centered: true,
        labels: {
          confirm: t('call_to_action.delete', { ns: 'common' }),
          cancel: t('call_to_action.cancel', { ns: 'common' }),
        },
        confirmProps: {
          color: 'red',
        },
        onConfirm: async () => {
          try {
            const favoritesAdapter = new FavoriteAdapter();
            await favoritesAdapter.deleteFavoriteList(id);

            showNotification({
              title: `${name} ${t('message.list_deleted', { ns: 'common' })}`,
              message: t('message.list_deleted_success', { ns: 'common' }),
              color: 'green',
              icon: <IconTrash />,
            });

            router.replace(router.asPath);
          } catch (err) {
            console.log(err);

            showNotification({
              title: t('message.error', { ns: 'common' }),
              message: t('message.list_not_deleted_error', { ns: 'common' }),
              icon: <IconInfoCircle />,
              color: 'red',
            });
          }
        },
      });
    };
  };

  return (
    <Card>
      <Card.Section p="md">
        <Group position="apart">
          <Badge color={props.privacy === 'PRIVATE' ? 'red' : 'green'} mb="sm">
            {t(`list.${props.privacy.toLowerCase()}`, { ns: 'common' })}
          </Badge>

          <Group spacing="xs">
            <ActionIcon
              aria-label={t('modal.update_list.update_list', { ns: 'common' })}
              onClick={() =>
                openContextModal({
                  modal: 'update-list',
                  title: t('modal.update_list.update_list', { ns: 'common' }),
                  centered: true,
                  innerProps: {
                    list: props,
                  },
                })
              }
            >
              <IconEdit size={18} />
            </ActionIcon>
            <ActionIcon
              aria-label={t('call_to_action.delete_list', { ns: 'common' })}
              onClick={deleteList(props.id, props.name)}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Group>
        </Group>

        <Title color="primary" size="h3" order={3}>
          <Anchor component={Link} href={`/favorites/${props.id}`}>
            {props.name}
          </Anchor>
        </Title>
        <Divider />
      </Card.Section>

      <Card.Section p="md">
        <Text>{props.description}</Text>
      </Card.Section>

      <Group position="right">
        <Button
          variant="light"
          size="xs"
          component={Link}
          href={`/favorites/${props.id}`}
        >
          {t('view_list')}
        </Button>
      </Group>
    </Card>
  );
}
