'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAppConfig } from '../hooks/use-app-config';
import { createFavoriteList } from '../serverActions/favorites/createFavoriteList';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';

import { FavoriteListItemDto } from '@/lib/api/generated/data-contracts';

type CreateFavoriteListDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (createdList?: FavoriteListItemDto) => void | Promise<void>;
  /** Passed through to DialogContent so focus returns to the trigger on close. */
  restoreFocusElement?: HTMLElement | null;
  /** Passed through to DialogContent for aria-controls linkage on the trigger. */
  id?: string;
};

export function CreateFavoriteListDialog({
  open,
  onOpenChange,
  onSuccess,
  restoreFocusElement,
  id,
}: CreateFavoriteListDialogProps) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');

  const [formState, setFormState] = useState<{
    name: string;
    description: string;
    public: boolean;
  }>({
    name: '',
    description: '',
    public: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      const created = await createFavoriteList(formState, appConfig.tenantId);

      if (created) {
        toast.success(t('favorites.list_created'), {
          description: t('favorites.list_created_message'),
        });
        handleClose();
        await onSuccess?.(created);
      }
    } catch {
      toast.error(t('message.error'), {
        description: t('favorites.unable_to_create_list_message'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setFormValue = (
    fieldName: keyof typeof formState,
    value: (typeof formState)[typeof fieldName],
  ) => {
    setFormState((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleClose = () => {
    setFormState({
      name: '',
      description: '',
      public: false,
    });
    onOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose();
    } else {
      onOpenChange(isOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent id={id} restoreFocusElement={restoreFocusElement}>
        <DialogHeader>
          <DialogTitle>{t('modal.create_list.create_a_list')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('modal.create_list.description')}
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-favorite-form"
          className="flex flex-col gap-2"
          onSubmit={handleSubmit}
        >
          <div>
            <Label htmlFor="name">{t('modal.create_list.list_name')}</Label>
            <Input
              id="name"
              value={formState.name}
              onChange={(e) => setFormValue('name', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">
              {t('modal.create_list.list_description')}
            </Label>
            <Textarea
              id="description"
              value={formState.description}
              onChange={(e) => setFormValue('description', e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={formState.public}
              onCheckedChange={(checked) => setFormValue('public', checked)}
            />
            <Label htmlFor="public">{t('modal.create_list.make_public')}</Label>
          </div>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t('call_to_action.cancel')}
          </Button>
          <Button
            type="submit"
            form="create-favorite-form"
            data-testid="create-list-submit-btn"
            loading={isSubmitting}
          >
            {t('call_to_action.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
