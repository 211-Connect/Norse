'use client';

import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { deleteFavoriteList } from '@/app/(app)/shared/serverActions/favorites/deleteFavoriteList';
import { Trash2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';

export function DeleteFavoriteListButton({ id, name }) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { stringifiedSearchParams } = useClientSearchParams();

  const onConfirm = async () => {
    try {
      await deleteFavoriteList(id, appConfig.tenantId);

      toast.success(`${name} ${t('message.list_deleted')}`, {
        description: t('message.list_deleted_success'),
      });

      // If we're on a detail page, navigate back to the list page with preserved query params
      // Otherwise, just refresh the current page
      if (
        pathname?.includes('/favorites/') &&
        !pathname.endsWith('/favorites')
      ) {
        router.push(`/favorites${stringifiedSearchParams}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.log(err);

      toast.error(t('message.error'), {
        description: t('message.list_not_deleted_error'),
      });
    } finally {
      setOpen(false);
    }
  };

  return (
    <>
      <Button size="icon" variant="outline" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('call_to_action.delete')}{' '}
              <span className="italic">{name}?</span>
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('call_to_action.cancel')}
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              {t('call_to_action.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
