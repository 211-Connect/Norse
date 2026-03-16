'use client';

import { Send, Smartphone } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { useAppConfig } from '../hooks/use-app-config';
import { fetchWrapper } from '../lib/fetchWrapper';

export function SmsButton({ title = '', body = '', shortUrl = '' }) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const appConfig = useAppConfig();
  const session = useSession();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogId = useId();
  const inputId = useId();
  const errorId = useId();
  const [message, setMessage] = useState('');

  const phoneNumberSchema = z.string().refine((value) => {
    const phoneRegex = /^\+?\d{10,15}$/;
    return phoneRegex.test(value);
  }, t('modal.share.invalid_phone_number'));

  const validatePhoneNumber = (value: unknown) => {
    const validationResult = phoneNumberSchema.safeParse(value);
    return validationResult.success
      ? null
      : t('modal.share.invalid_phone_number');
  };

  const handleClick = () => {
    setOpen(true);
  };

  const sendSms = async () => {
    const errorMessage = validatePhoneNumber(phoneNumber);

    if (errorMessage) {
      setMessage(errorMessage);
      return;
    }

    const promise = fetchWrapper(`/api/share/${appConfig.tenantId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        phoneNumber: phoneNumber,
        message: `${title}\n\n${body}\n\n${shortUrl}`,
      },
    }).catch((error) => {
      // fetchWrapper returns null for non-FetchError errors
      // Re-throw for toast to handle
      throw error || new Error(t('modal.share.sms_send_failed_body'));
    });

    toast.promise(promise, {
      loading: t('modal.share.sms_sending_body'),
      success: (_res) => {
        setOpen(false);
        setPhoneNumber('');
        setMessage('');
        return t('modal.share.sms_send_success_body');
      },
      error: (err) => {
        return err instanceof Error
          ? err.message
          : t('modal.share.sms_send_failed_body');
      },
    });
  };

  return (
    <>
      <Button
        ref={triggerRef}
        className="flex gap-1"
        onClick={handleClick}
        variant="outline"
        aria-controls={dialogId}
        aria-haspopup="dialog"
      >
        <Smartphone className="size-4" />
        {t('modal.share.sms')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent id={dialogId} restoreFocusElement={triggerRef.current}>
          <DialogHeader>
            <DialogTitle>{t('modal.share.share_sms')}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              <label className="sr-only" htmlFor={inputId}>
                {t('modal.share.phone_number_label')}
              </label>
              <Input
                id={inputId}
                aria-describedby={message ? errorId : undefined}
                aria-invalid={message ? true : undefined}
                placeholder={t('modal.share.enter_phone_number')}
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (message) {
                    setMessage('');
                  }
                }}
              />
              <Button className="flex h-full gap-1" onClick={sendSms}>
                <Send className="size-4" />
                {t('call_to_action.send')}
              </Button>
            </div>

            {message && message.length > 0 && (
              <p id={errorId} className="text-sm text-red-600" role="alert">
                {message}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
