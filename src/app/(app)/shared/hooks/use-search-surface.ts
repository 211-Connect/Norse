'use client';

import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { searchSurfacePayload } from '@/app/(app)/shared/lib/analytics';
import { landingPageIdAtom } from '@/app/(app)/shared/store/search';

/** `surface`, `landingPageId` and `locale` for search and result events. */
export function useSearchSurface(): Record<string, string> {
  const landingPageId = useAtomValue(landingPageIdAtom);
  const { i18n } = useTranslation();
  return useMemo(
    () => searchSurfacePayload(landingPageId, i18n.language),
    [landingPageId, i18n.language],
  );
}
