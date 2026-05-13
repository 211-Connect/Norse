'use client';

import { useTranslation } from 'react-i18next';

import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';

type PurgeConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function PurgeConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: PurgeConfirmDialogProps) {
  const { t } = useTranslation('page-list');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('purge_list.confirm_title')}</DialogTitle>
          <DialogDescription>
            {t('purge_list.confirm_description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('purge_list.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            data-testid="purge-list-confirm-btn"
          >
            {t('purge_list.label')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
