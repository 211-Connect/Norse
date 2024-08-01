import { Button, Group, Text, TextInput } from '@mantine/core';
import { showNotification, updateNotification } from '@mantine/notifications';
import { ContextModalProps } from '@mantine/modals';

import { useTranslation } from 'next-i18next';
import axios from 'axios';
import { useForm } from '@mantine/form';
import { z } from 'zod';

type Props = ContextModalProps<{
  shareContents: { title: string; body: string };
  printFn?: () => void;
}>;

export function SendSMS(props: Props) {
  const { t } = useTranslation('common');
  const form = useForm({
    initialValues: {
      phoneNumber: '',
    },
    validate: (values) => {
      const phoneNumberError = validatePhoneNumber(values.phoneNumber);
      return {
        phoneNumber: phoneNumberError,
      };
    },
    validateInputOnChange: true,
  });
  const phoneNumberSchema = z.string().refine((value) => {
    const phoneRegex = /^\+?\d{10,15}$/;
    return phoneRegex.test(value);
  }, t('modal.share.invalid_phone_number', { ns: 'common' }) as string);
  const validatePhoneNumber = (value: unknown) => {
    const validationResult = phoneNumberSchema.safeParse(value);
    return validationResult.success ? null : 'Invalid phone number';
  };

  const sendSMS = form.onSubmit(async () => {
    showNotification({
      id: 'load-data-notification',
      title: t('modal.share.sms_sending_title'),
      message: t('modal.share.sms_sending_body'),
      loading: true,
    });

    const response = await axios.post('/api/share', {
      phoneNumber: form.values.phoneNumber,
      message: `\n${props.innerProps.shareContents.body}`,
    });

    if (response.status === 200) {
      updateNotification({
        id: 'load-data-notification',
        title: t('modal.share.sms_send_success_title'),
        message: t('modal.share.sms_send_success_body'),
        color: 'green',
        loading: false,
      });
    } else {
      updateNotification({
        id: 'load-data-notification',
        title: t('modal.share.sms_send_failed_title'),
        message: t('modal.share.sms_send_failed_body'),
        color: 'red',
        loading: false,
      });
    }
  });

  return (
    <>
      <Text>{t('modal.share.share_sms')}</Text>
      <Group spacing={5}>
        <TextInput
          placeholder={t('modal.share.enter_phone_number') as string}
          error={form.errors.phoneNumber}
          {...form.getInputProps('phoneNumber')}
        />
        <Button onClick={() => sendSMS()}>Send</Button>
      </Group>
    </>
  );
}
