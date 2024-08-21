import { favoriteListsAtom } from '@/shared/store/favorites';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'next-i18next';
import { CreateAListButton } from './create-a-list-button';
import { FavoriteList } from './favorite-list';

export function FavoriteListsSection() {
  const { t } = useTranslation('page-favorites');
  const favoriteLists = useAtomValue(favoriteListsAtom);

  return (
    <div className="flex w-full flex-col lg:max-w-[550px]">
      <div className="p-2">
        <CreateAListButton />
      </div>

      <div className="flex items-center justify-end bg-primary p-1 pl-2 pr-2 text-primary-foreground">
        <p>
          {favoriteLists.length}
          {` `}
          {t('lists')}
        </p>
      </div>

      <div className="flex flex-col gap-2 p-2">
        {favoriteLists.map((list) => {
          return <FavoriteList key={list._id} list={list} />;
        })}
      </div>
    </div>
  );
}
