import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useAtomValue, useSetAtom } from 'jotai';
import { dialogsAtom, promptAuthAtom } from '@/shared/store/dialogs';
import { useTranslation } from 'next-i18next';
import { Button } from '../ui/button';
import { signIn } from 'next-auth/react';

export function PromptAuthDialog() {
  const { t } = useTranslation('common');
  const setState = useSetAtom(dialogsAtom);
  const state = useAtomValue(promptAuthAtom);

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
