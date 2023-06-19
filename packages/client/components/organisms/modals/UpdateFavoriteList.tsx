import { FavoriteAdapter } from '../../../lib/adapters/FavoriteAdapter';
import { Button, Group, Switch, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { ContextModalProps } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

export function UpdateFavoriteListModal({
  context,
  id,
  innerProps,
}: ContextModalProps<{ list: any }>) {
  const form = useForm({
    initialValues: {
      name: innerProps.list.name,
      description: innerProps.list.description,
      public: innerProps.list.privacy === 'PUBLIC',
    },
  });
  const router = useRouter();
  const { t } = useTranslation('common');

  const onSubmit = async (values: any) => {
    try {
      if (values.name.length > 0) {
        const favoritesAdapter = new FavoriteAdapter();
        await favoritesAdapter.updateFavoriteList({
          id: innerProps.list.id,
          name: values.name,
          description: values.description,
          privacy: values.public,
        });

        context.closeModal(id);

        showNotification({
          title: `${t('text:list')} ${values.name} ${t('text:updated')}`,
          message: t('message:list-updated'),
          icon: <IconInfoCircle />,
          color: 'green',
        });

        router.replace(router.asPath);
      }
    } catch (err) {
      console.log(err);

      showNotification({
        title: t('text:error'),
        message: t('error:list-not-updated'),
        icon: <IconInfoCircle />,
        color: 'red',
      });
    }
  };

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
      <TextInput
        label={t('modal.update_list.list_name')}
        required
        {...form.getInputProps('name')}
      />

      <Textarea
        label={t('modal.update_list.list_description')}
        mt="md"
        mb="md"
        rows={2}
        {...form.getInputProps('description')}
      />

      <Switch
        size="sm"
        label={t('modal.update_list.make_public')}
        mb="md"
        {...form.getInputProps('public', { type: 'checkbox' })}
      />

      <Group position="right">
        <Button
          type="button"
          variant="default"
          onClick={() => context.closeModal(id)}
        >
          {t('call_to_action.cancel')}
        </Button>
        <Button type="submit">{t('call_to_action.update')}</Button>
      </Group>
    </form>
  );
}
