'use client';

import { useSyncLocalFavoritesOnAuth } from '../hooks/use-sync-local-favorites-on-auth';

export function SyncLocalFavoritesOnAuthEffect() {
  useSyncLocalFavoritesOnAuth();
  return null;
}
