'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { purgeFavoriteList } from '@/app/(app)/shared/serverActions/favorites/purgeFavoriteList';
import { createLogger } from '@/lib/logger';

import { PurgeIconButton } from './purge-icon-button';

const log = createLogger('purge-favorite-list-button');

type PurgeFavoriteListButtonProps = {
  id: string;
  onPurge: () => void;
};

export function PurgeFavoriteListButton({
  id,
  onPurge,
}: PurgeFavoriteListButtonProps) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('page-list');
  const router = useRouter();

  const onConfirm = async () => {
    try {
      await purgeFavoriteList(id, appConfig.tenantId);

      onPurge();
      router.refresh();

      toast.success(t('purge_list.success'));
    } catch (err) {
      log.error({ err }, 'Failed to purge favorite list');

      toast.error(t('purge_list.error'));
    }
  };

  return <PurgeIconButton onConfirm={onConfirm} />;
}
