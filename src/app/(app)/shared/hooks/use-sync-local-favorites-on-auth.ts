'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createLogger } from '@/lib/logger';

import { syncLocalFavoriteList } from '../serverActions/favorites/syncLocalFavoriteList';
import { useAppConfig } from './use-app-config';
import { useLocalFavorites } from './use-local-favorites';

const log = createLogger('useSyncLocalFavoritesOnAuth');

function normalizeLocalFavoriteIds(ids: string[]): string[] {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

function isFavoritesPagePath(pathname: string | null): boolean {
  if (!pathname) return false;
  return /\/favorites\/?$/.test(pathname);
}

export function useSyncLocalFavoritesOnAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');
  const { localFavoriteIds, clearLocalFavorites } = useLocalFavorites();
  const syncInProgressRef = useRef(false);
  const lastSyncedSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (session.status !== 'authenticated') {
      return;
    }

    const ids = normalizeLocalFavoriteIds(localFavoriteIds);
    if (ids.length === 0) {
      return;
    }

    const signature = [...ids].sort().join('|');
    if (
      syncInProgressRef.current ||
      lastSyncedSignatureRef.current === signature
    ) {
      return;
    }

    syncInProgressRef.current = true;

    void (async () => {
      try {
        const result = await syncLocalFavoriteList(ids, appConfig.tenantId);

        if (result === 'created') {
          toast.success(t('favorites.list_created'), {
            description: t('favorites.list_created_message'),
          });
        }

        clearLocalFavorites();
        lastSyncedSignatureRef.current = signature;

        if (isFavoritesPagePath(pathname)) {
          router.refresh();
        }
      } catch (error) {
        log.error(
          { error },
          'Failed to sync local favorites on authentication',
        );
        // keep local favorites for a future retry
      } finally {
        syncInProgressRef.current = false;
      }
    })();
  }, [
    appConfig.tenantId,
    clearLocalFavorites,
    localFavoriteIds,
    pathname,
    router,
    session.status,
    t,
  ]);
}
