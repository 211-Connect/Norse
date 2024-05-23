import { FavoriteAdapter } from '../../lib/adapters/FavoriteAdapter';
import { Button, Group, Text } from '@mantine/core';
import { ContextModalProps } from '@mantine/modals';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

export function RemoveFavoriteFromList({
  context,
  id,
  innerProps,
}: ContextModalProps<{ id: string; favoriteListId: string }>) {
  const router = useRouter();
  const { t } = useTranslation('common');

  const closeModal = () => context.closeModal(id);

  const removeFavoriteFromList = () => {
    return async () => {
      const favoritesAdapter = new FavoriteAdapter();
      await favoritesAdapter.removeFavoriteFromList({
        resourceId: innerProps.id,
        favoriteListId: innerProps.favoriteListId,
      });

      closeModal();

      await router.replace(`/favorites/${innerProps.favoriteListId}`);
    };
  };

  return (
    <div>
      <Text>{t('modal.remove_from_list.are_you_sure')}</Text>

      <Group position="right">
        <Button variant="default" onClick={closeModal}>
          {t('call_to_action.cancel')}
        </Button>
        <Button onClick={removeFavoriteFromList()}>
          {t('call_to_action.remove')}
        </Button>
      </Group>
    </div>
  );
}
