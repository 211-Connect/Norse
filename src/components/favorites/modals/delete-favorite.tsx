import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAtom, useAtomValue } from 'jotai';
import { useTranslation } from 'next-i18next';
import { deleteFavoriteFromFavoriteListDialogAtom } from '../state';
import FavoriteAdapter from '@/lib/client/adapters/favorite-adapter';
import { useRouter } from 'next/router';
import { deleteFavoriteFromFavoriteListMutation } from '../mutations';

export default function DeleteFavorite() {
  const { t } = useTranslation();
  const [data, setData] = useAtom(deleteFavoriteFromFavoriteListDialogAtom);
  const { mutate } = useAtomValue(deleteFavoriteFromFavoriteListMutation);
  const router = useRouter();

  const removeFavoriteFromList = () => {
    return async () => {
      await mutate({
        resourceId: data.id,
        favoriteListId: data.favoriteListId,
      });

      setData((prev) => ({ ...prev, isOpen: false }));

      await router.replace(`/favorites/${data.favoriteListId}`);
    };
  };

  return (
    <Dialog
      open={data.isOpen}
      onOpenChange={(open) => setData((prev) => ({ ...prev, isOpen: open }))}
    >
      <DialogContent className="p-4">
        <DialogHeader>
          <DialogTitle>{t('modal.remove_from_list.are_you_sure')}</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setData((prev) => ({ ...prev, isOpen: false }))}
            >
              {t('call_to_action.cancel')}
            </Button>
            <Button variant="destructive" onClick={removeFavoriteFromList()}>
              {t('call_to_action.remove')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
