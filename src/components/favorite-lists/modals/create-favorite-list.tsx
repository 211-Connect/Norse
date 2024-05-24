import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAtom, useAtomValue } from 'jotai';
import { useTranslation } from 'next-i18next';
import router from 'next/router';
import { createFavoriteListDialogAtom } from '../state';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { createFavoriteListMutation } from '../mutations';

export function CreateAFavoriteListModal() {
  const [data, setData] = useAtom(createFavoriteListDialogAtom);
  const { mutate } = useAtomValue(createFavoriteListMutation);
  const { t } = useTranslation('common');
  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      public: false,
    },
    async onSubmit({ value }) {
      await mutate({
        name: value.name,
        description: value.description,
        privacy: value.public ? 'PUBLIC' : 'PRIVATE',
      });

      setData((prev) => ({ ...prev, isOpen: false }));
      router.replace(router.asPath);
    },
  });

  return (
    <Dialog
      open={data.isOpen}
      onOpenChange={(open) => setData((prev) => ({ ...prev, isOpen: open }))}
    >
      <DialogContent className="p-4">
        <DialogHeader>
          <DialogTitle>
            {t('modal.create_list.create_a_list', { ns: 'common' })}
          </DialogTitle>
        </DialogHeader>

        <form
          id="createForm"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col gap-2"
        >
          <form.Field
            name="name"
            children={(field) => (
              <>
                <Label htmlFor={field.name}>
                  {t('modal.create_list.list_name')}
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </>
            )}
          />

          <form.Field
            name="description"
            children={(field) => (
              <>
                <Label htmlFor={field.name}>
                  {t('modal.create_list.list_description')}
                </Label>
                <Textarea
                  rows={2}
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </>
            )}
          />

          <form.Field
            name="public"
            children={(field) => (
              <div className="flex items-center space-x-2">
                <Switch
                  id={field.name}
                  name={field.name}
                  checked={field.state.value}
                  onBlur={field.handleBlur}
                  onCheckedChange={(e) => field.handleChange(e)}
                />
                <Label>{t('modal.create_list.make_public')}</Label>
              </div>
            )}
          />
        </form>

        <DialogFooter>
          <div className="flex gap-2 items-center justify-end">
            <Button
              variant="outline"
              onClick={() => setData((prev) => ({ ...prev, isOpen: false }))}
            >
              {t('call_to_action.cancel')}
            </Button>
            <Button type="submit" form="createForm">
              {t('call_to_action.create')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
