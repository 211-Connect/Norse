import { openContextModal } from '@mantine/modals';
import FavoriteList from './list';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAtomValue, useSetAtom } from 'jotai';
import { createFavoriteListDialogAtom, favoriteListsAtom } from './state';
import DeleteFavoriteList from './modals/delete-favorite-list';
import { UpdateFavoriteListModal } from './modals/update-favorite-list';
import { CreateAFavoriteListModal } from './modals/create-favorite-list';

export function FavoriteLists() {
  const { t } = useTranslation('page-favorites');
  const setCreateModal = useSetAtom(createFavoriteListDialogAtom);
  const { data } = useAtomValue(favoriteListsAtom);

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex">
        <Button
          onClick={() => {
            setCreateModal((prev) => ({
              ...prev,
              isOpen: true,
            }));
          }}
        >
          {t('modal.create_list.create_a_list', { ns: 'common' })}
        </Button>
      </div>

      <div className="flex items-center justify-end">
        <p id="result-total">
          {data.length} {t('lists')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {data.map((el: any) => (
          <FavoriteList
            key={el._id}
            _id={el._id}
            name={el.name}
            description={el.description}
            privacy={el.privacy}
          />
        ))}

        {data.length === 0 && (
          <Card>
            <CardContent className="p-4 text-center gap-4 flex flex-col">
              <div className="flex justify-center">
                <Image
                  src="/undraw_no_data.svg"
                  width={0}
                  height={150}
                  alt=""
                  style={{ height: '150px', width: 'auto' }}
                />
              </div>

              <h3 className="font-semibold">{t('no_lists')}</h3>
            </CardContent>
          </Card>
        )}
      </div>

      <DeleteFavoriteList />
      <UpdateFavoriteListModal />
      <CreateAFavoriteListModal />
    </div>
  );
}
