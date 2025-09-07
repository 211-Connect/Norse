'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { signIn } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { dialogsAtom, promptAuthAtom } from '@/app/shared/store/dialogs';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

export function PromptAuthDialog() {
  const setState = useSetAtom(dialogsAtom);
  const state = useAtomValue(promptAuthAtom);

  const { t } = useTranslation('common');

  const handleOpenChange = (value: boolean) => {
    setState((prev) => ({
      ...prev,
      promptAuth: {
        ...prev.promptAuth,
        open: value,
      },
    }));
  };

  return (
    <Dialog open={state.open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('modal.prompt_auth')}</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <div className="flex justify-end">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => handleOpenChange(false)} variant="outline">
              {t('call_to_action.cancel')}
            </Button>

            <Button
              onClick={() =>
                signIn('keycloak', { callbackUrl: window.location.href })
              }
            >
              {t('call_to_action.login')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
