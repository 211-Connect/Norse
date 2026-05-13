'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAppConfig } from './use-app-config';

const LOCAL_FAVORITES_KEY = 'local-favorites';
const LOCAL_FAVORITES_UPDATED_EVENT = 'local-favorites-updated';

function readFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
}

function writeToStorage(ids: string[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(ids));
}

function emitLocalFavoritesUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(LOCAL_FAVORITES_UPDATED_EVENT));
}

export function useLocalFavorites() {
  const appConfig = useAppConfig();
  const anonymousCollectionsEnabled =
    appConfig.featureFlags.anonymousCollectionsEnabled;
  const [ids, setIds] = useState<string[]>([]);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    if (!anonymousCollectionsEnabled) {
      setIds([]);
      return;
    }

    const syncFromStorage = () => {
      setIds(readFromStorage());
    };

    syncFromStorage();

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener(LOCAL_FAVORITES_UPDATED_EVENT, syncFromStorage);

    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener(
        LOCAL_FAVORITES_UPDATED_EVENT,
        syncFromStorage,
      );
    };
  }, [anonymousCollectionsEnabled]);

  const addLocalFavorite = useCallback(
    (id: string) => {
      if (!anonymousCollectionsEnabled) return;

      const current = readFromStorage();
      if (current.includes(id)) return;

      const next = [...current, id];
      writeToStorage(next);
      setIds(next);
      emitLocalFavoritesUpdated();
    },
    [anonymousCollectionsEnabled],
  );

  const removeLocalFavorite = useCallback(
    (id: string) => {
      if (!anonymousCollectionsEnabled) return;

      const current = readFromStorage();
      const next = current.filter((value) => value !== id);
      writeToStorage(next);
      setIds(next);
      emitLocalFavoritesUpdated();
    },
    [anonymousCollectionsEnabled],
  );

  const isLocalFavorite = useCallback(
    (id: string) => anonymousCollectionsEnabled && ids.includes(id),
    [anonymousCollectionsEnabled, ids],
  );

  const clearLocalFavorites = useCallback(() => {
    if (!anonymousCollectionsEnabled) return;

    setIds([]);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOCAL_FAVORITES_KEY);
      emitLocalFavoritesUpdated();
    }
  }, [anonymousCollectionsEnabled]);

  return {
    localFavoriteIds: ids,
    addLocalFavorite,
    removeLocalFavorite,
    isLocalFavorite,
    clearLocalFavorites,
  };
}
