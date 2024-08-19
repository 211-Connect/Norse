import { useTranslation } from 'next-i18next';
import { Button } from './ui/button';
import { Linkedin, Mail, Printer, Share2, Smartphone } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useEffect, useState } from 'react';
import { Facebook } from './icons/facebook';
import { X } from './icons/x';
import { ShortUrlService } from '../services/short-url-service';
import { Input } from './ui/input';
import { useClipboard } from '../hooks/use-clipboard';

export function ShareButton({ componentToPrintRef }) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const clipboard = useClipboard();
  const handlePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
  });
  const [shortUrl, setShortUrl] = useState('');

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
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
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
                <Facebook className="size-4 fill-white" />
                {t('modal.share.facebook')}
              </Button>

              <Button
                className="flex gap-1"
                onClick={() => {
                  window.open(
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shortUrl)}`,
                    '_blank',
                  );
                }}
              >
                <Linkedin className="size-4 fill-white" />
                {t('modal.share.linkedin')}
              </Button>

              <Button
                className="flex gap-1"
                onClick={() => {
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      shortUrl,
                    )}`,
                  );
                }}
              >
                <X className="size-4 fill-white" />X
              </Button>

              <Button className="flex gap-1">
                <Smartphone className="size-4" />
                {t('modal.share.sms')}
              </Button>

              <Button
                className="flex gap-1"
                onClick={() => {
                  window.open(`mailto:&body=${encodeURIComponent(shortUrl)}`);
                }}
              >
                <Mail className="size-4" />
                {t('modal.share.email')}
              </Button>

              <Button className="flex gap-1" onClick={handlePrint}>
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
