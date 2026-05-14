'use client';

import { useTranslation } from 'react-i18next';

import { CardLayoutRenderer } from '@/app/(app)/features/search/components/card-layout-renderer';
import { SearchCardLayoutConfig } from '@/app/(app)/features/search/types/card-layout-config';
import { type Favorite as FavoriteType } from '@/app/(app)/shared/store/favorites';

import {
  RemoveFromListHandler,
  favoriteToResult,
} from '../utils/favorite-result-transformers';

export function Favorite({
  data,
  cardLayout,
  currentListId,
  onRemoveFromList,
}: {
  data: FavoriteType;
  cardLayout: SearchCardLayoutConfig;
  currentListId?: string;
  onRemoveFromList?: RemoveFromListHandler;
}) {
  const { i18n } = useTranslation();

  const result = favoriteToResult(
    data,
    i18n.language,
    currentListId,
    onRemoveFromList,
  );

  return <CardLayoutRenderer layout={cardLayout} result={result} />;
}
