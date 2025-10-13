'use client';

import { Button } from '@/app/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/shared/components/ui/dialog';
import { useAuth } from '@/app/shared/hooks/use-auth';
import { removeFavoriteFromList } from '@/app/shared/services/favorite-service';
import { HeartOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function RemoveFromFavoriteListButton({ id, favoriteListId }) {
  const { sessionId } = useAuth();
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const removeFavoriteFromListHandler = async () => {
    await removeFavoriteFromList(
      {
        resourceId: id,
        favoriteListId: favoriteListId,
      },
      sessionId,
    );

    setOpen(false);

    await router.refresh();
  };

  return (
    <>
      <Button
        size="icon"
        onClick={() => setOpen(true)}
        variant="ghost"
        className="size-6 print:hidden"
      >
        <HeartOff className="size-6" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('modal.remove_from_list.are_you_sure')}
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('call_to_action.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={removeFavoriteFromListHandler}
            >
              {t('call_to_action.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
