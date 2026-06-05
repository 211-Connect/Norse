'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAppConfig } from './use-app-config';

const LOCAL_FAVORITES_KEY = 'local-favorites';
const LOCAL_FAVORITES_UPDATED_EVENT = 'local-favorites-updated';
const MAX_LOCAL_FAVORITES = 100;

function readFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const validStrings = parsed.filter(
      (value): value is string => typeof value === 'string',
    );
    // Cap at MAX_LOCAL_FAVORITES to prevent unbounded storage
    return validStrings.slice(0, MAX_LOCAL_FAVORITES);
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
  const requireAuthenticationForFavorites =
    appConfig.featureFlags.requireAuthenticationForFavorites;
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    if (requireAuthenticationForFavorites) {
      setIds([]);
      setHydrated(true);
      return;
    }

    const syncFromStorage = () => {
      setIds(readFromStorage());
    };

    syncFromStorage();
    setHydrated(true);

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener(LOCAL_FAVORITES_UPDATED_EVENT, syncFromStorage);

    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener(
        LOCAL_FAVORITES_UPDATED_EVENT,
        syncFromStorage,
      );
    };
  }, [requireAuthenticationForFavorites]);

  const addLocalFavorite = useCallback(
    (id: string) => {
      if (requireAuthenticationForFavorites) return;

      const current = readFromStorage();
      if (current.includes(id)) return;

      // Enforce cap before adding
      if (current.length >= MAX_LOCAL_FAVORITES) {
        console.warn(
          `Cannot add more than ${MAX_LOCAL_FAVORITES} local favorites`,
        );
        return;
      }

      const next = [...current, id];
      writeToStorage(next);
      setIds(next);
      emitLocalFavoritesUpdated();
    },
    [requireAuthenticationForFavorites],
  );

  const removeLocalFavorite = useCallback(
    (id: string) => {
      if (requireAuthenticationForFavorites) return;

      const current = readFromStorage();
      const next = current.filter((value) => value !== id);
      writeToStorage(next);
      setIds(next);
      emitLocalFavoritesUpdated();
    },
    [requireAuthenticationForFavorites],
  );

  const isLocalFavorite = useCallback(
    (id: string) => !requireAuthenticationForFavorites && ids.includes(id),
    [requireAuthenticationForFavorites, ids],
  );

  const clearLocalFavorites = useCallback(() => {
    if (requireAuthenticationForFavorites) return;

    setIds([]);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOCAL_FAVORITES_KEY);
      emitLocalFavoritesUpdated();
    }
  }, [requireAuthenticationForFavorites]);

  return {
    localFavoriteIds: ids,
    addLocalFavorite,
    removeLocalFavorite,
    isLocalFavorite,
    clearLocalFavorites,
    hydrated,
  };
}
