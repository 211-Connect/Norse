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
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { toast } from 'sonner';

export function DeleteFavoriteListButton({ id, name }) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    try {
      await FavoriteService.deleteFavoriteList(id);

      toast.success(`${name} ${t('message.list_deleted')}`, {
        description: t('message.list_deleted_success'),
      });

      router.replace('/favorites');
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
