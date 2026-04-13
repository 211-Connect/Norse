'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { signIn } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { dialogsAtom, promptAuthAtom } from '@/app/(app)/shared/store/dialogs';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { buttonVariants } from '../ui/button';

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

  const callbackUrl = typeof window !== 'undefined' ? window.location.href : '';
  const loginHref = `/api/auth/signin/keycloak?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  const handleLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    handleOpenChange(false);
    signIn('keycloak', { callbackUrl });
  };

  return (
    <Dialog open={state.open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('modal.prompt_auth')}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button onClick={() => handleOpenChange(false)} variant="outline">
            {t('call_to_action.cancel')}
          </Button>

          <a
            className={cn(buttonVariants(), 'inline-flex')}
            href={loginHref}
            data-testid="login-btn"
            onClick={handleLogin}
          >
            {t('call_to_action.login')}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
