import { favoriteListWithFavoritesAtom } from '@/shared/store/favorites';
import { useAtomValue } from 'jotai';
import { Favorite } from './favorite';

export function FavoritesSection() {
  const favoriteList = useAtomValue(favoriteListWithFavoritesAtom);

  return (
    <div className="flex w-full flex-col lg:max-w-[550px]">
      {/* 
      <div className="flex items-center justify-end bg-primary p-1 pl-2 pr-2 text-primary-foreground">
        <p>
          {favoriteLists.length}
          {` `}
          {t('lists')}
        </p>
      </div> */}

      <div className="flex flex-col gap-2 p-2">
        {favoriteList?.favorites?.map((list) => {
          return (
            <Favorite
              key={list._id}
              data={list}
              viewingAsOwner={favoriteList.viewingAsOwner}
              favoriteListId={favoriteList._id}
            />
          );
        })}
      </div>
    </div>
  );
}
