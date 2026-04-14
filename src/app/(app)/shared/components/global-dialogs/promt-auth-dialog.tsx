'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { signIn } from 'next-auth/react';
import { useEffect, useRef } from 'react';
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

  // Capture the trigger element in a ref when the dialog opens so it survives
  // the synchronous state reset that happens when handleOpenChange(false) is
  // called. Without this, restoreFocusElement would already be null by the
  // time Radix fires onCloseAutoFocus.
  const focusRestoreRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (state.open) {
      focusRestoreRef.current = state.returnFocusTo;
    }
  }, [state.open, state.returnFocusTo]);

  const handleOpenChange = (value: boolean) => {
    setState((prev) => ({
      ...prev,
      promptAuth: {
        ...prev.promptAuth,
        open: value,
        returnFocusTo: value ? prev.promptAuth.returnFocusTo : null,
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
      <DialogContent
        restoreFocusElement={focusRestoreRef.current}
        closeLabel={t('call_to_action.close')}
      >
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
