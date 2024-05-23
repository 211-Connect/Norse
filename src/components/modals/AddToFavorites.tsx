import {
  ActionIcon,
  Badge,
  Button,
  Group,
  ScrollArea,
  Skeleton,
  Table,
  TextInput,
} from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { ContextModalProps } from '@mantine/modals';
import { IconPlaylistAdd } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';
import { useCallback, useEffect, useState } from 'react';
import { FavoriteAdapter } from '../../lib/adapters/FavoriteAdapter';
import { showNotification } from '@mantine/notifications';

type Props = ContextModalProps<{ serviceAtLocationId: string }>;

export function AddToFavoritesModal(props: Props) {
  const [value, setValue] = useDebouncedState('', 200);
  const [fetching, setFetching] = useState<any>({
    data: [],
    status: 'loading',
  });
  const { t } = useTranslation('common');

  const refreshFavoritesList = useCallback(async () => {
    setFetching({ data: [], status: 'loading' });

    const favoritesAdapter = new FavoriteAdapter();
    const favoriteLists = await favoritesAdapter.searchFavoriteLists({
      textToSearchFor: value,
    });

    if (favoriteLists) {
      setFetching({ data: favoriteLists, status: 'success' });
      return;
    }
  }, [value]);

  useEffect(() => {
    refreshFavoritesList();
  }, [refreshFavoritesList]);

  const addToFavoriteList = (listId: string) => {
    return async () => {
      const favoritesAdapter = new FavoriteAdapter();

      try {
        await favoritesAdapter.addToFavoriteList({
          resourceId: props.innerProps.serviceAtLocationId,
          favoriteListId: listId,
        });

        showNotification({
          title: t('favorites.added_to_list'),
          message: t('favorites.added_to_list_message'),
          color: 'green',
          autoClose: 5000,
        });
      } catch (err) {
        showNotification({
          title: t('favorites.already_exists'),
          message: t('favorites.already_exists_message'),
          color: 'red',
          autoClose: 5000,
        });
      }
    };
  };

  const createNewList = () => {
    return async () => {
      const favoritesAdapter = new FavoriteAdapter();
      const created = await favoritesAdapter.createFavoriteList({
        name: value,
        privacy: false,
      });

      if (created) {
        refreshFavoritesList();
      }
    };
  };

  return (
    <>
      <TextInput
        mb="lg"
        label={t('modal.add_to_list.search_list')}
        defaultValue={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        error={
          fetching.status === 'success' &&
          fetching.data.length === 0 && (
            <>
              {t('modal.add_to_list.not_found')}
              <Button variant="subtle" compact onClick={createNewList()}>
                {t('modal.add_to_list.create_new_list')}
              </Button>
            </>
          )
        }
      />

      <ScrollArea>
        <Table verticalSpacing="sm" width="100%" mb="lg">
          <thead>
            <tr>
              <th>{t('modal.add_to_list.list_name')}</th>
              <th>{t('modal.add_to_list.list_privacy')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {fetching.status === 'loading' && (
              <tr>
                <td>
                  <Skeleton height={18} width={125} />
                </td>
                <td>
                  <Skeleton height={18} maw="50px">
                    <Badge>{t('list.private')}</Badge>
                  </Skeleton>
                </td>
                <td>
                  <Group position="right">
                    <Skeleton height={18} width={30} />
                  </Group>
                </td>
              </tr>
            )}

            {fetching.status === 'success' && (
              <>
                {fetching.data.map((el: any) => {
                  return (
                    <tr key={el._id}>
                      <td>{el.name}</td>
                      <td>
                        <Badge
                          color={el.privacy === 'PRIVATE' ? 'red' : 'green'}
                        >
                          {el.privacy === 'PRIVATE'
                            ? t('list.private')
                            : t('list.public')}
                        </Badge>
                      </td>
                      <td>
                        <Group position="right">
                          <ActionIcon
                            onClick={addToFavoriteList(el._id)}
                            aria-label={t('modal.add_to_list.add_to_list')}
                          >
                            <IconPlaylistAdd />
                          </ActionIcon>
                        </Group>
                      </td>
                    </tr>
                  );
                })}
              </>
            )}
          </tbody>
        </Table>
      </ScrollArea>
    </>
  );
}
