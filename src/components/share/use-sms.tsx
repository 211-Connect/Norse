import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from 'next-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '../ui/input';
import { useForm } from '@tanstack/react-form';
import axios from 'axios';
import { zodValidator } from '@tanstack/zod-form-adapter';
import z from 'zod';
import { toast } from 'sonner';

function useSms(textContent: string) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm({
    defaultValues: {
      phoneNumber: '',
    },
    validatorAdapter: zodValidator,
    async onSubmit({ value }) {
      toast(t('modal.share.sms_sending_title'), {
        description: t('modal.share.sms_sending_body'),
      });

      const response = await axios.post('/api/share', {
        phoneNumber: value.phoneNumber,
        message: `\n${textContent}`,
      });

      if (response.status === 200) {
        toast.success(t('modal.share.sms_send_success_title'), {
          description: t('modal.share.sms_send_success_body'),
        });
      } else {
        toast.error(t('modal.share.sms_send_failed_title'), {
          description: t('modal.share.sms_send_failed_body'),
        });
      }
    },
  });
  const { t } = useTranslation();

  function open() {
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  const SendSmsDialog = () => {
    if (!isOpen) return null;

    return (
      <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modal.share.share_sms')}</DialogTitle>
          </DialogHeader>
          <form
            className="flex gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.Field
              name="phoneNumber"
              validators={{
                onChange: z.string().refine((value) => {
                  const phoneRegex = /^\+?\d{10,15}$/;
                  return phoneRegex.test(value);
                }, t('modal.share.invalid_phone_number', { ns: 'common' }) as string),
              }}
            >
              {(field) => (
                <div className="flex flex-col w-full gap-1">
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('modal.share.enter_phone_number') as string}
                  />
                  <em className="text-sm text-destructive">
                    {field.state.meta.touchedErrors}
                  </em>
                </div>
              )}
            </form.Field>

            <Button type="submit">Send</Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return {
    isOpen,
    open,
    close,
    SendSmsDialog,
  };
}

export default useSms;
