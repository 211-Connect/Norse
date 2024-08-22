import { favoriteListsAtom } from '@/shared/store/favorites';
import { useAtomValue } from 'jotai';
import { CreateAListButton } from './create-a-list-button';
import { FavoriteList } from './favorite-list';
import { NoListsCard } from './no-lists-card';

export function FavoriteListsSection() {
  const favoriteLists = useAtomValue(favoriteListsAtom);

  return (
    <div className="flex w-full flex-col lg:max-w-[550px]">
      <div className="p-2 pb-0">
        <CreateAListButton />
      </div>

      <div className="flex flex-col gap-2 p-2">
        {favoriteLists.map((list) => {
          return <FavoriteList key={list._id} list={list} />;
        })}

        {favoriteLists?.length === 0 && <NoListsCard />}
      </div>
    </div>
  );
}
