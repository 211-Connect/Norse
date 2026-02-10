'use client';

import { favoriteListsAtom } from '@/app/(app)/shared/store/favorites';
import { useAtomValue } from 'jotai';

import { CreateAListButton } from './create-a-list-button';
import { FavoriteList } from './favorite-list';
import { FavoritesPagination } from './favorites-pagination';
import { NoListsCard } from './no-lists-card';

export function FavoriteListsSection() {
  const favoriteLists = useAtomValue(favoriteListsAtom);

  return (
    <div className="flex w-full flex-col p-[10px] lg:max-w-[550px] lg:pl-[20px]">
      <CreateAListButton className="self-start" />

      <div className="mt-[10px] flex flex-col gap-2">
        {favoriteLists.map((list) => {
          return <FavoriteList key={list._id} {...list} />;
        })}

        {favoriteLists.length > 0 && <FavoritesPagination />}
        {favoriteLists?.length === 0 && <NoListsCard />}
      </div>
    </div>
  );
}
