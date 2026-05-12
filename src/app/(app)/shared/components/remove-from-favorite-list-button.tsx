'use client';

import { HeartOff } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAppConfig } from '../hooks/use-app-config';
import { cn } from '../lib/utils';
import { removeFavoriteFromList } from '../serverActions/favorites/removeFavoriteFromList';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

type RemoveFromFavoriteListButtonProps = {
  serviceAtLocationId: string;
  resourceName?: string;
  currentListId: string;
  onRemoveFromList: (listId: string, favoriteId: string) => void;
};

export function RemoveFromFavoriteListButton({
  serviceAtLocationId,
  resourceName,
  currentListId,
  onRemoveFromList,
}: RemoveFromFavoriteListButtonProps) {
  const appConfig = useAppConfig();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const { t } = useTranslation('common');

  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveFromCurrentList = async () => {
    try {
      setIsRemoving(true);

      await removeFavoriteFromList(
        {
          resourceId: serviceAtLocationId,
          favoriteListId: currentListId,
        },
        appConfig.tenantId,
      );

      toast.success(t('favorites.removed_from_list'), {
        description: t('favorites.removed_from_list_message'),
      });

      // Notify parent to update UI
      onRemoveFromList(currentListId, serviceAtLocationId);

      setRemoveConfirmOpen(false);
    } catch (error) {
      toast.error(t('message.error'), {
        description: t('favorites.unable_to_update_list_message'),
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <Button
        ref={triggerRef}
        className={cn('flex size-6 gap-1')}
        size={'icon'}
        variant={'ghost'}
        aria-label={
          resourceName
            ? `${t('call_to_action.remove_from_list')} ${resourceName}`
            : t('call_to_action.remove_from_list')
        }
        aria-haspopup="dialog"
        data-testid="remove-from-list-btn"
        onClick={() => setRemoveConfirmOpen(true)}
      >
        <HeartOff className="size-6" aria-hidden="true" />
      </Button>

      <Dialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <DialogContent
          restoreFocusElement={triggerRef.current}
          closeLabel={t('call_to_action.close')}
        >
          <DialogHeader>
            <DialogTitle>{t('favorites.remove_from_list_title')}</DialogTitle>
            <DialogDescription>
              {t('favorites.remove_from_list_description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveConfirmOpen(false)}
              disabled={isRemoving}
            >
              {t('call_to_action.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveFromCurrentList}
              disabled={isRemoving}
              data-testid="remove-from-current-list-confirm-btn"
              loading={isRemoving}
            >
              {t('call_to_action.remove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
