'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dialogsAtom, promptAuthAtom } from '@/app/(app)/shared/store/dialogs';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { buttonVariants } from '../ui/button';

export function PromptAuthDialog() {
  const setState = useSetAtom(dialogsAtom);
  const state = useAtomValue(promptAuthAtom);
  const [loginHref, setLoginHref] = useState('/api/auth/signin/keycloak');

  const { t } = useTranslation('common');

  useEffect(() => {
    const callbackUrl = encodeURIComponent(window.location.href);
    setLoginHref(`/api/auth/signin/keycloak?callbackUrl=${callbackUrl}`);
  }, []);

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

            <a
              className={cn(buttonVariants(), 'inline-flex')}
              href={loginHref}
              data-testid="login-btn"
              onClick={() => handleOpenChange(false)}
            >
              {t('call_to_action.login')}
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
