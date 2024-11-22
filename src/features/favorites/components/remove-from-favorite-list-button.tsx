import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { FavoriteService } from '@/shared/services/favorite-service';
import { HeartOff } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function RemoveFromFavoriteListButton({ id, favoriteListId }) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const removeFavoriteFromList = async () => {
    await FavoriteService.removeFavoriteFromList({
      resourceId: id,
      favoriteListId: favoriteListId,
    });

    setOpen(false);

    await router.replace(`/favorites/${favoriteListId}`);
  };

  return (
    <>
      <Button
        size="icon"
        onClick={() => setOpen(true)}
        variant="outline"
        className="print:hidden"
      >
        <HeartOff className="size-4" />
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
            <Button variant="destructive" onClick={removeFavoriteFromList}>
              {t('call_to_action.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
