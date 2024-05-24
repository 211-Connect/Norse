import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAtom, useAtomValue } from 'jotai';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { updateFavoriteListDialogAtom } from '../state';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { updateFavoriteListMutation } from '../mutations';

export function UpdateFavoriteListModal() {
  const { mutate } = useAtomValue(updateFavoriteListMutation);
  const [data, setData] = useAtom(updateFavoriteListDialogAtom);

  const form = useForm({
    defaultValues: {
      name: data.list?.name,
      description: data.list?.description,
      public: data.list?.privacy === 'PUBLIC',
    },
    async onSubmit({ value }) {
      try {
        if (value.name.length > 0) {
          await mutate({
            _id: data.list._id,
            name: value.name,
            description: value.description,
            privacy: value.public ? 'PUBLIC' : 'PRIVATE',
          });

          setData((prev) => ({
            ...prev,
            isOpen: false,
          }));

          // showNotification({
          //   title: `${t('favorites.updated_list')}`,
          //   message: t('favorites.updated_list_message'),
          //   icon: <IconInfoCircle />,
          //   color: 'green',
          // });

          router.replace(router.asPath);
        }
      } catch (err) {
        console.log(err);

        // showNotification({
        //   title: t('favorites.Unable to update list'),
        //   message: t('favorites.unable_to_update_list_message'),
        //   icon: <IconInfoCircle />,
        //   color: 'red',
        // });
      }
    },
  });

  const router = useRouter();
  const { t } = useTranslation('common');

  return (
    <Dialog
      open={data.isOpen}
      onOpenChange={(open) => setData((prev) => ({ ...prev, isOpen: open }))}
    >
      <DialogContent className="p-4">
        <DialogHeader>
          <DialogTitle>{data.title}</DialogTitle>
        </DialogHeader>

        <form
          id="updateForm"
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
                  {t('modal.update_list.list_name')}
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
                  {t('modal.update_list.list_description')}
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
                <Label>{t('modal.update_list.make_public')}</Label>
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
            <Button variant="default" type="submit" form="updateForm">
              {t('call_to_action.update')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
