import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import { FavoriteService } from '@/shared/services/favorite-service';
import { SquarePen } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function UpdateFavoriteListButton({ id, name, description, privacy }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation('common');
  const [formState, setFormState] = useState({
    name,
    description,
    public: privacy === 'PUBLIC',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formState.name.length === 0) return;

    try {
      await FavoriteService.updateFavoriteList({
        id: id,
        name: formState.name,
        description: formState.description,
        privacy: formState.public,
      });

      toast.success(t('favorites.updated_list'), {
        description: t('favorites.updated_list_message'),
      });

      router.replace(router.asPath);
    } catch (err) {
      console.log(err);

      toast.error(t('favorites.unable_to_update_list'), {
        description: t('favorites.unable_to_update_list_message'),
      });
    } finally {
      setOpen(false);
    }
  };

  const setValue = (fieldName: keyof typeof formState, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  useEffect(() => {
    setFormState({
      name,
      description,
      public: privacy === 'PUBLIC',
    });
  }, [open, name, description, privacy]);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="icon" variant="outline">
        <SquarePen className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modal.update_list.update_list')}</DialogTitle>
            <DialogDescription />
          </DialogHeader>

          <form
            id="update-favorite-form"
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
            <Button form="update-favorite-form" type="submit">
              {t('call_to_action.update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
