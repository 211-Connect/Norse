'use client';

import {
  CheckIcon,
  ClipboardIcon,
  Linkedin,
  Mail,
  Printer,
  Share2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';

import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Facebook } from './icons/facebook';
import { X } from './icons/x';
import { shortenUrl } from '../serverActions/shortUrl/shortenUrl';
import { useClipboard } from '../hooks/use-clipboard';
import { SmsButton } from './sms-button';
import { useAppConfig } from '../hooks/use-app-config';

export function ShareButton({ componentToPrintRef, title = '', body = '' }) {
  const appConfig = useAppConfig();
  const clipboard = useClipboard();
  const handlePrint = useReactToPrint({
    contentRef: componentToPrintRef,
  });
  const { t } = useTranslation('common');

  const [open, setOpen] = useState(false);
  const [shortUrl, setShortUrl] = useState('');

  useEffect(() => {
    async function getShortUrl() {
      const id = await shortenUrl(window.location.href, appConfig.tenantId);
      const url = `${window.location.origin}${appConfig.customBasePath}/api/share/${appConfig.tenantId}/${id}`;
      setShortUrl(url);
    }

    getShortUrl();
  }, [appConfig.customBasePath, appConfig.tenantId]);

  return (
    <>
      <Button
        className="flex gap-1"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <Share2 className="size-4" />
        {t('call_to_action.share')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modal.share.share_via')}</DialogTitle>
            <DialogDescription />
          </DialogHeader>

          <div className="flex flex-col gap-2 overflow-hidden">
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

            <div className="relative flex">
              <Button
                onClick={() => clipboard.copy(shortUrl)}
                variant="outline"
                className="group flex w-full items-center justify-between gap-1"
              >
                {shortUrl}

                {clipboard.copied ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <ClipboardIcon className="hidden size-4 group-hover:block" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
