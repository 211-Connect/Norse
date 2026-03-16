'use client';

import {
  CheckIcon,
  ClipboardIcon,
  Linkedin,
  Mail,
  Printer,
  Share2,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogId = useId();

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
        ref={triggerRef}
        className="flex gap-1"
        variant="outline"
        onClick={() => setOpen(true)}
        aria-controls={dialogId}
        aria-haspopup="dialog"
        aria-label={
          title
            ? `${t('call_to_action.share')} ${title}`
            : t('call_to_action.share')
        }
      >
        <Share2 className="size-4" />
        {t('call_to_action.share')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent id={dialogId} restoreFocusElement={triggerRef.current}>
          <DialogHeader>
            <DialogTitle>{t('modal.share.share_via')}</DialogTitle>
            <DialogDescription />
          </DialogHeader>

          <div className="flex flex-col gap-2 overflow-hidden">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="flex gap-1"
                aria-label={`${t('modal.share.facebook')} ${t('modal.share.opens_in_new_tab')}`}
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
                <span className="sr-only">
                  {' '}
                  {t('modal.share.opens_in_new_tab')}
                </span>
              </Button>

              <Button
                variant="outline"
                className="flex gap-1"
                aria-label={`${t('modal.share.linkedin')} ${t('modal.share.opens_in_new_tab')}`}
                onClick={() => {
                  window.open(
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shortUrl)}`,
                    '_blank',
                  );
                }}
              >
                <Linkedin className="size-4" />
                {t('modal.share.linkedin')}
                <span className="sr-only">
                  {' '}
                  {t('modal.share.opens_in_new_tab')}
                </span>
              </Button>

              <Button
                variant="outline"
                className="flex gap-1"
                aria-label={`X ${t('modal.share.opens_in_new_tab')}`}
                onClick={() => {
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      title + '\n' + shortUrl,
                    )}`,
                  );
                }}
              >
                <X className="size-4" />X
                <span className="sr-only">
                  {' '}
                  {t('modal.share.opens_in_new_tab')}
                </span>
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
                aria-label={t('modal.share.copy_link')}
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
