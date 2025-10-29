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
import { Input } from '@/app/(app)/shared/components/ui/input';
import { Label } from '@/app/(app)/shared/components/ui/label';
import { Switch } from '@/app/(app)/shared/components/ui/switch';
import { Textarea } from '@/app/(app)/shared/components/ui/textarea';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { cn } from '@/app/(app)/shared/lib/utils';
import { createFavoriteList } from '@/app/(app)/shared/services/favorite-service';
import { PlusIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const initialState = {
  name: '',
  description: '',
  public: false,
};

export function CreateAListButton({ className = '' }: { className?: string }) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');
  const router = useRouter();
  const pathname = usePathname();

  const [open, _setOpen] = useState(false);
  const [formState, setFormState] = useState(initialState);

  const setOpen = (value: boolean) => {
    setFormState(initialState);
    _setOpen(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newList = await createFavoriteList(
      {
        name: formState.name,
        description: formState.description,
        privacy: formState.public,
      },
      undefined,
      appConfig.tenantId,
    );

    if (newList) {
      setOpen(false);
      router.replace(pathname);
    }
  };

  const setValue = (fieldName: keyof typeof formState, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className={cn('flex gap-1', className)}
      >
        <PlusIcon className="size-4" />
        {t('modal.create_list.create_a_list')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modal.create_list.create_a_list')}</DialogTitle>
            <DialogDescription />
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
                onChange={(e) => setValue('name', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">
                {t('modal.create_list.list_description')}
              </Label>
              <Textarea
                id="description"
                value={formState.description}
                onChange={(e) => setValue('description', e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={formState.public}
                onCheckedChange={(checked) => setValue('public', checked)}
              />
              <Label htmlFor="public">
                {t('modal.create_list.make_public')}
              </Label>
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('call_to_action.cancel')}
            </Button>
            <Button type="submit" form="create-favorite-form">
              {t('call_to_action.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
