'use client';

import { Send, Smartphone } from 'lucide-react';
import { useCallback, useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { useAppConfig } from '../hooks/use-app-config';
import { fetchWrapper } from '../lib/fetchWrapper';
import { validatePhoneNumber } from '../lib/validators';

type SmsButtonProps = {
  shareMessage: string;
};

export function SmsButton({ shareMessage }: SmsButtonProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const appConfig = useAppConfig();
  const isDisabled = !appConfig.sms;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogId = useId();
  const inputId = useId();
  const errorId = useId();
  const [errorMessage, setErrorMessage] = useState('');

  const getPhoneError = useCallback(
    (value: unknown): string | null =>
      validatePhoneNumber(value) ? null : t('modal.share.invalid_phone_number'),
    [t],
  );

  const handleClick = () => {
    setOpen(true);
  };

  const sendSms = async () => {
    const errorMessage = getPhoneError(phoneNumber);

    if (errorMessage) {
      setErrorMessage(errorMessage);
      return;
    }

    const promise = fetchWrapper(`/api/share/${appConfig.tenantId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        phoneNumber: phoneNumber,
        message: shareMessage,
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
        setErrorMessage('');
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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={isDisabled ? 0 : undefined}>
              <Button
                ref={triggerRef}
                className="flex w-full gap-1"
                onClick={handleClick}
                variant="outline"
                aria-controls={isDisabled ? undefined : dialogId}
                aria-haspopup={isDisabled ? undefined : 'dialog'}
                disabled={isDisabled}
              >
                <Smartphone className="size-4" aria-hidden="true" />
                {t('modal.share.sms')}
              </Button>
            </span>
          </TooltipTrigger>
          {isDisabled && (
            <TooltipContent>{t('modal.share.sms_unavailable')}</TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          id={dialogId}
          restoreFocusElement={triggerRef.current}
          closeLabel={t('call_to_action.close')}
        >
          <DialogHeader>
            <DialogTitle>{t('modal.share.share_sms')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              <label className="sr-only" htmlFor={inputId}>
                {t('modal.share.phone_number_label')}
              </label>
              <Input
                id={inputId}
                aria-describedby={errorMessage ? errorId : undefined}
                aria-invalid={errorMessage ? true : undefined}
                placeholder={t('modal.share.enter_phone_number')}
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (errorMessage) {
                    setErrorMessage('');
                  }
                }}
              />
              <Button className="flex h-full gap-1" onClick={sendSms}>
                <Send className="size-4" aria-hidden="true" />
                {t('call_to_action.send')}
              </Button>
            </div>

            {errorMessage && errorMessage.length > 0 && (
              <p id={errorId} className="text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
