'use client';

import { Send, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSetAtom } from 'jotai';
import { z } from 'zod';
import axios from 'axios';
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
import { dialogsAtom } from '../store/dialogs';

export function SmsButton({ title = '', body = '', shortUrl = '' }) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const appConfig = useAppConfig();
  const session = useSession();
  const setDialog = useSetAtom(dialogsAtom);
  const [message, setMessage] = useState('');

  const phoneNumberSchema = z.string().refine((value) => {
    const phoneRegex = /^\+?\d{10,15}$/;
    return phoneRegex.test(value);
  }, t('modal.share.invalid_phone_number'));

  const validatePhoneNumber = (value: unknown) => {
    const validationResult = phoneNumberSchema.safeParse(value);
    return validationResult.success ? null : 'Invalid phone number';
  };

  const handleClick = () => {
    if (!true) {
      const { userAgent } = navigator;
      const isIOS = /iPhone|iPad|iPod|Macintosh/i.test(userAgent);
      let smsLink = '';
      if (isIOS) {
        smsLink = `sms:&body=\n${encodeURIComponent(`${title}\n\n${body}\n\n${shortUrl}`)}`;
      } else {
        smsLink = `sms:?body=\n${encodeURIComponent(`${title}\n\n${body}\n\n${shortUrl}`)}`;
      }
      window.open(smsLink, '_blank');
    } else if (!session.data) {
      setOpen(true);
      // setDialog((prev) => ({
      //   ...prev,
      //   promptAuth: {
      //     ...prev.promptAuth,
      //     open: true,
      //   },
      // }));
    } else {
      setOpen(true);
    }
  };

  const sendSms = async () => {
    const errorMessage = validatePhoneNumber(phoneNumber);

    if (errorMessage) {
      setMessage(errorMessage);
      return;
    }

    const promise = axios.post(`/api/share/${appConfig.tenantId}`, {
      phoneNumber: phoneNumber,
      message: `${title}\n\n${body}\n\n${shortUrl}`,
    });

    toast.promise(promise, {
      loading: t('modal.share.sms_sending_body'),
      success: (_res) => {
        setOpen(false);
        return t('modal.share.sms_send_success_body');
      },
      error: t('modal.share.sms_send_failed_body'),
    });
  };

  return (
    <>
      <Button className="flex gap-1" onClick={handleClick} variant="outline">
        <Smartphone className="size-4" />
        {t('modal.share.sms')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modal.share.share_sms')}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              <Input
                placeholder={t('modal.share.enter_phone_number')}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Button className="flex gap-1" onClick={sendSms}>
                <Send className="size-4" />
                Send
              </Button>
            </div>

            {message && message.length > 0 && (
              <p className="text-sm text-red-600">{message}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
