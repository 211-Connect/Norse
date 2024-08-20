import { useTranslation } from 'next-i18next';
import { Button } from './ui/button';
import { Linkedin, Mail, Printer, Share2, Smartphone } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useEffect, useState } from 'react';
import { Facebook } from './icons/facebook';
import { X } from './icons/x';
import { ShortUrlService } from '../services/short-url-service';
import { Input } from './ui/input';
import { useClipboard } from '../hooks/use-clipboard';
import { useAppConfig } from '../hooks/use-app-config';
import { SmsButton } from './sms-button';

export function ShareButton({ componentToPrintRef, title, body }) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const clipboard = useClipboard();
  const handlePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
  });
  const [shortUrl, setShortUrl] = useState('');
  const appConfig = useAppConfig();

  useEffect(() => {
    async function getShortUrl() {
      const { url } = await ShortUrlService.getShortUrl(window.location.href);
      setShortUrl(url);
    }

    getShortUrl();
  }, []);

  return (
    <>
      <Button className="flex gap-1" onClick={() => setOpen(true)}>
        <Share2 className="size-4" />
        {t('call_to_action.share')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modal.share.share_via')}</DialogTitle>
            <DialogDescription />
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="flex gap-1"
                onClick={() => {
                  window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      shortUrl,
                    )}`,
                    '_blank',
                  );
                }}
              >
                <Facebook className="size-4" />
                {t('modal.share.facebook')}
              </Button>

              <Button
                variant="outline"
                className="flex gap-1"
                onClick={() => {
                  window.open(
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shortUrl)}`,
                    '_blank',
                  );
                }}
              >
                <Linkedin className="size-4" />
                {t('modal.share.linkedin')}
              </Button>

              <Button
                variant="outline"
                className="flex gap-1"
                onClick={() => {
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      title + '\n' + shortUrl,
                    )}`,
                  );
                }}
              >
                <X className="size-4" />X
              </Button>

              <SmsButton title={title} body={body} shortUrl={shortUrl} />

              <Button
                variant="outline"
                className="flex gap-1"
                onClick={() => {
                  window.open(
                    `mailto:?subject=${encodeURIComponent(
                      title,
                    )}&body=${encodeURIComponent(body + '\n\n' + shortUrl)}`,
                  );
                }}
              >
                <Mail className="size-4" />
                {t('modal.share.email')}
              </Button>

              <Button
                variant="outline"
                className="flex gap-1"
                onClick={handlePrint}
              >
                <Printer className="size-4" />
                {t('modal.share.print')}
              </Button>
            </div>

            <div className="flex">
              <Input disabled value={shortUrl} />
              <Button onClick={() => clipboard.copy(shortUrl)}>
                {clipboard.copied
                  ? t('modal.share.copied')
                  : t('modal.share.copy')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
