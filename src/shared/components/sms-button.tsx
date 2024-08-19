import { useTranslation } from 'next-i18next';
import { useAppConfig } from '../hooks/use-app-config';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Send, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { Input } from './ui/input';
import { useSession } from 'next-auth/react';
import { PromptAuthDialog } from './global-dialogs/promt-auth-dialog';
import { useSetAtom } from 'jotai';
import { dialogsAtom } from '../store/dialogs';

export function SmsButton({ title, body, shortUrl }) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const appConfig = useAppConfig();
  const session = useSession();
  const setDialog = useSetAtom(dialogsAtom);

  const handleClick = () => {
    if (!('sms' in appConfig.features)) {
      const { userAgent } = navigator;
      const isIOS = /iPhone|iPad|iPod|Macintosh/i.test(userAgent);
      let smsLink = '';
      if (isIOS) {
        smsLink = `sms:&body=\n${encodeURIComponent(body + '\n\n' + shortUrl)}`;
      } else {
        smsLink = `sms:?body=\n${encodeURIComponent(body + '\n\n' + shortUrl)}`;
      }
      window.open(smsLink, '_blank');
    } else if (!session.data) {
      setDialog((prev) => ({
        ...prev,
        promptAuth: {
          ...prev.promptAuth,
          open: true,
        },
      }));
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <Button className="flex gap-1" onClick={handleClick}>
        <Smartphone className="size-4" />
        {t('modal.share.sms')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modal.share.share_sms')}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="flex gap-2">
            <Input placeholder={t('modal.share.enter_phone_number')} />
            <Button className="flex gap-1">
              <Send className="size-4" />
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
