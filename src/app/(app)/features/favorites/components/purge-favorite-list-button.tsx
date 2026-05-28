'use client';

import { Eraser } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { purgeFavoriteList } from '@/app/(app)/shared/serverActions/favorites/purgeFavoriteList';
import { createLogger } from '@/lib/logger';

import { PurgeConfirmDialog } from './purge-confirm-dialog';

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
  const [open, setOpen] = useState(false);
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
    } finally {
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        variant="outline"
        onClick={() => setOpen(true)}
        data-testid="purge-list-btn"
      >
        <Eraser className="size-4" />
      </Button>
      <PurgeConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={onConfirm}
      />
    </>
  );
}
