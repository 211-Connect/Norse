import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useTranslation } from 'next-i18next';
import { useForm } from '@tanstack/react-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import FavoriteAdapter from '../adapters/favorite-adapter';
import useDebounce from '@/hooks/use-debounce';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';

function useAddToList(resourceId: string) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  function open() {
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  const AddToFavoriteListDialog = () => {
    const [value, setValue] = useState('');
    const queryClient = useQueryClient();
    const debouncedValue = useDebounce(value);
    const { data, isFetching } = useQuery({
      initialData: [],
      placeholderData: (prev) => prev,
      queryKey: [
        'favorite',
        'lists',
        'search',
        resourceId,
        debouncedValue,
        isOpen,
      ],
      queryFn: async () => {
        if (!isOpen) return [];

        const favoriteListAdapter = FavoriteAdapter();
        return await favoriteListAdapter.searchFavoriteLists({
          textToSearchFor: debouncedValue,
        });
      },
    });
    const form = useForm({
      defaultValues: {
        listName: '',
      },
    });

    const createList = async (name: string) => {
      const favoriteAdapter = FavoriteAdapter();
      const queryData = queryClient.getQueryData([
        'favorite',
        'lists',
        'search',
        resourceId,
        debouncedValue,
      ]) as any[];
      const newList = [...queryData];
      newList.push({
        _id: '000000000000000000000000',
        name: name,
        description: '',
        privacy: 'PRIVATE',
      });
      queryClient.setQueryData(
        ['favorite', 'lists', 'search', resourceId, debouncedValue],
        newList,
      );

      await favoriteAdapter.createFavoriteList({
        name: name,
        privacy: 'PRIVATE',
      });

      queryClient.invalidateQueries({
        queryKey: ['favorite', 'lists', 'search', resourceId, debouncedValue],
      });
    };
    const addToList = async (id: string) => {
      const favoriteAdapter = FavoriteAdapter();
      try {
        await favoriteAdapter.addToFavoriteList({
          resourceId: resourceId,
          favoriteListId: id,
        });
        toast.success(t('favorites.added_to_list'), {
          description: t('favorites.added_to_list_message'),
        });
      } catch (err) {
        if (isAxiosError(err)) {
          if (err.response.status === 409) {
            toast.error(t('favorites.already_exists'), {
              description: t('favorites.already_exists_message'),
            });
          }
        }
      }
    };

    if (!isOpen) return null;

    return (
      <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.Field name="listName">
              {(field) => (
                <div className="flex flex-col gap-1">
                  <Label htmlFor={field.name}>
                    {t('modal.add_to_list.search_list')}
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    placeholder={t('modal.add_to_list.search_list')}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      setValue(e.target.value);
                    }}
                  />
                  {data.length === 0 && !isFetching && value.length > 0 && (
                    <div className="flex gap-2 items-center">
                      <p className="text-sm font-semibold text-destructive">
                        {t('modal.add_to_list.not_found')}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => createList(value)}
                      >
                        {t('modal.add_to_list.create_new_list')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </form.Field>
          </form>
          <ScrollArea className="h-[300px] w-full">
            <div className="flex flex-col gap-1">
              {data?.map((list) => {
                return (
                  <div
                    key={list._id}
                    className="flex items-center justify-between rounded-md p-2 shadow-sm border hover:shadow-md"
                  >
                    <div>
                      <p className="font-semibold">{list.name}</p>
                      <p className="text-sm">{list.description}</p>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant="outline">
                        {list.privacy === 'PRIVATE'
                          ? t('list.private')
                          : t('list.public')}
                      </Badge>
                      <Button size="sm" onClick={() => addToList(list._id)}>
                        {t('modal.add_to_list.add_to_list')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  };

  return {
    isOpen,
    open,
    close,
    AddToFavoriteListDialog,
  };
}

export default useAddToList;
