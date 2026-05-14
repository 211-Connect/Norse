'use client';

import { useAtomValue } from 'jotai';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { FavoritesSearchBar } from '@/app/(app)/shared/components/favorites-search-bar';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';
import { FAVORITES_SEARCH_DEBOUNCE_DELAY } from '@/app/(app)/shared/lib/constants';
import { favoriteListsStateAtom } from '@/app/(app)/shared/store/favorites';

import { CreateAListButton } from './create-a-list-button';
import { FavoriteList } from './favorite-list';
import { FavoritesPagination } from './favorites-pagination';
import { NoListsCard } from './no-lists-card';

export function FavoriteListsSection() {
  const { data: favoriteLists } = useAtomValue(favoriteListsStateAtom);
  const { t } = useTranslation('common');
  const router = useRouter();
  const pathname = usePathname();
  const { stringifiedSearchParams } = useClientSearchParams();

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(stringifiedSearchParams);
      const currentSearch = params.get('search') || '';

      if (value === currentSearch) return;

      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      params.set('page', '1'); // Reset to page 1 on search
      router.push(`${pathname}?${params.toString()}`);
    },
    [stringifiedSearchParams, pathname, router],
  );

  const initialSearch = useMemo(
    () => new URLSearchParams(stringifiedSearchParams).get('search') || '',
    [stringifiedSearchParams],
  );

  return (
    <div className="flex w-full flex-col p-[10px] lg:max-w-[550px] lg:pl-[20px]">
      <div className="flex w-full flex-col items-center gap-2 md:flex-row">
        <CreateAListButton className="h-9 self-start" />
        {(favoriteLists.length > 0 || initialSearch) && (
          <FavoritesSearchBar
            className="h-full w-full"
            placeholder={t('modal.add_to_list.search_list')}
            initialValue={initialSearch}
            onChange={handleSearch}
            debounceDelay={FAVORITES_SEARCH_DEBOUNCE_DELAY}
          />
        )}
      </div>

      <div className="mt-[10px] flex flex-col gap-2">
        {favoriteLists.map((list) => {
          return <FavoriteList key={list.id} list={list} />;
        })}

        {favoriteLists.length > 0 && <FavoritesPagination />}
        {favoriteLists?.length === 0 && <NoListsCard />}
      </div>
    </div>
  );
}
