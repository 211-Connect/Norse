import { FavoriteAdapter } from '../../../lib/adapters/FavoriteAdapter';
import { Button, Group, Switch, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { ContextModalProps } from '@mantine/modals';
import { useTranslation } from 'next-i18next';
import router from 'next/router';

export function CreateAFavoriteListModal({ context, id }: ContextModalProps) {
  const { t } = useTranslation('common');
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      public: false,
    },
  });

  const onSubmit = async (values: any) => {
    const favoritesAdapter = new FavoriteAdapter();
    const created = await favoritesAdapter.createFavoriteList({
      ...values,
      privacy: values.public,
    });

    if (created) {
      context.closeModal(id);
      router.replace(router.asPath);
    }
  };

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
      <TextInput
        label={t('modal.create_list.list_name')}
        required
        {...form.getInputProps('name')}
      />

      <Textarea
        label={t('modal.create_list.list_description') as string}
        mt="md"
        mb="md"
        name="description"
        rows={2}
        {...form.getInputProps('description')}
      />

      <Switch
        size="sm"
        label={t('modal.create_list.make_public') as string}
        mb="md"
        {...form.getInputProps('public')}
      />

      <Group position="right">
        <Button variant="default" onClick={() => context.closeModal(id)}>
          {t('call_to_action.cancel')}
        </Button>
        <Button type="submit">{t('call_to_action.create')}</Button>
      </Group>
    </form>
  );
}
