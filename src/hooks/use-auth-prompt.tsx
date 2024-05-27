import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from 'next-i18next';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';

function useAuthPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  function open() {
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  const AuthPrompt = () => {
    if (!isOpen) return null;

    return (
      <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('modal.prompt_auth', { ns: 'common' })}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              {t('call_to_action.cancel')}
            </Button>
            <Button
              onClick={() =>
                signIn('keycloak', { callbackUrl: window.location.href })
              }
            >
              {t('call_to_action.login')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return {
    isOpen,
    open,
    close,
    AuthPrompt,
  };
}

export default useAuthPrompt;
