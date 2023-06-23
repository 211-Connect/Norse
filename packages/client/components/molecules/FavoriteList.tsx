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
import { openContextModal } from '@mantine/modals';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';

type Props = {
  id: string;
  privacy: 'PRIVATE' | 'PUBLIC';
  name: string;
  description: string;
};

export function FavoriteList(props: Props) {
  const { t } = useTranslation('page-favorites');

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
              onClick={() => {
                openContextModal({
                  modal: 'delete-list',
                  innerProps: {
                    name: props.name,
                    id: props.id,
                  },
                });
              }}
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
