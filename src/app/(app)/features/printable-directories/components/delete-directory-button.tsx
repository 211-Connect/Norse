'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
import { deletePrintableDirectory } from '@/app/(app)/shared/serverActions/printableDirectories/deletePrintableDirectory';

type DeleteDirectoryButtonProps = {
  id: string;
  name: string;
  onDeleted: () => void;
};

export function DeleteDirectoryButton({
  id,
  name,
  onDeleted,
}: DeleteDirectoryButtonProps) {
  const appConfig = useAppConfig();
  const { t } = useTranslation(['page-directories', 'common']);
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onConfirm = async () => {
    setIsDeleting(true);

    try {
      const deleted = await deletePrintableDirectory(id, appConfig.tenantId);

      if (!deleted) {
        toast.error(
          t('unable_to_delete_directory', { ns: 'page-directories' }),
        );
        return;
      }

      onDeleted();
      toast.success(t('directory_deleted', { ns: 'page-directories' }));
    } catch {
      toast.error(t('unable_to_delete_directory', { ns: 'page-directories' }));
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label={t('delete_directory_aria', {
          ns: 'page-directories',
          name,
        })}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('delete_directory_title', { ns: 'page-directories' })}{' '}
              <span className="italic">{name}</span>?
            </DialogTitle>
            <DialogDescription>
              {t('delete_directory_description', { ns: 'page-directories' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              {t('call_to_action.cancel', { ns: 'common' })}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              loading={isDeleting}
            >
              {t('call_to_action.delete', { ns: 'common' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
