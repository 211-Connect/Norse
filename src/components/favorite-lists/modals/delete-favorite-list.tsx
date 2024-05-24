import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAtom, useAtomValue } from 'jotai';
import { deleteFavoriteListDialogAtom } from '../state';
import { useTranslation } from 'next-i18next';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';
import { deleteFavoriteListMutation } from '../mutations';

export default function DeleteFavoriteList() {
  const [data, setData] = useAtom(deleteFavoriteListDialogAtom);
  const { mutate } = useAtomValue(deleteFavoriteListMutation);
  const { t } = useTranslation();
  const router = useRouter();

  const onConfirm = async () => {
    try {
      await mutate(data.id);

      // showNotification({
      //   title: `${name} ${t('message.list_deleted', { ns: 'common' })}`,
      //   message: t('message.list_deleted_success', { ns: 'common' }),
      //   color: 'green',
      //   icon: <IconTrash />,
      // });

      setData((prev) => ({ ...prev, isOpen: false }));

      router.replace('/favorites');
    } catch (err) {
      console.log(err);

      // showNotification({
      //   title: t('message.error', { ns: 'common' }),
      //   message: t('message.list_not_deleted_error', { ns: 'common' }),
      //   icon: <IconInfoCircle />,
      //   color: 'red',
      // });

      setData((prev) => ({ ...prev, isOpen: false }));
    }
  };

  return (
    <Dialog
      open={data.isOpen}
      onOpenChange={(open) => setData((prev) => ({ ...prev, isOpen: open }))}
    >
      <DialogContent className="p-4">
        <DialogHeader>
          <DialogTitle>
            {t('call_to_action.delete')} {data.name}?
          </DialogTitle>
        </DialogHeader>

        <DialogFooter>
          <div className="flex gap-2 items-center justify-end">
            <Button
              variant="outline"
              onClick={() => setData((prev) => ({ ...prev, isOpen: false }))}
            >
              {t('call_to_action.cancel')}
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              {t('call_to_action.delete')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
