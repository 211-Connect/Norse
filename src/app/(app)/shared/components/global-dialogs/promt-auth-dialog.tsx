'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { signIn } from 'next-auth/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { dialogsAtom, promptAuthAtom } from '@/app/(app)/shared/store/dialogs';

import { cn, withOptionalCustomBasePath } from '../../lib/utils';
import { Button } from '../ui/button';
import { buttonVariants } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';

export function PromptAuthDialog() {
  const setState = useSetAtom(dialogsAtom);
  const state = useAtomValue(promptAuthAtom);
  const { t } = useTranslation('common');

  // Updating a ref during render is safe — refs don't trigger re-renders.
  // Capture the trigger element only while the dialog is open so the ref
  // survives the synchronous state reset that clears returnFocusTo when
  // handleOpenChange(false) fires before Radix runs onCloseAutoFocus.
  const focusRestoreRef = useRef<HTMLElement | null>(null);
  if (state.open) {
    focusRestoreRef.current = state.returnFocusTo;
  }

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
  const redirectTarget =
    typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}`
      : '/';
  const loginHref = withOptionalCustomBasePath(
    `/auth/signin?redirect=${encodeURIComponent(redirectTarget)}`,
  );

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
          <DialogDescription className="sr-only">
            {t('modal.prompt_auth_description')}
          </DialogDescription>
        </DialogHeader>
        <Label className="text-sm font-normal text-muted-foreground">
          {t('modal.prompt_auth_description')}
        </Label>
        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
