'use client';

import { useAtomValue } from 'jotai';
import { usePathname } from 'next/navigation';

import { ResourceEntry } from '@/app/(app)/shared/lib/umami';
import { searchEntryAtom } from '@/app/(app)/shared/store/search';

export function useResourceCardEntry(): ResourceEntry {
  const pathname = usePathname();
  const searchEntry = useAtomValue(searchEntryAtom);
  const isOnSearchResultsPage =
    pathname === '/search' || pathname?.endsWith('/search');

  return isOnSearchResultsPage ? searchEntry : ResourceEntry.SearchCard;
}
