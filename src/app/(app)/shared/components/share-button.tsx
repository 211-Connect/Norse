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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Facebook } from './icons/facebook';
import { X } from './icons/x';
import { shortenUrl } from '../serverActions/shortUrl/shortenUrl';
import { useClipboard } from '../hooks/use-clipboard';
import { SmsButton } from './sms-button';
import { useAppConfig } from '../hooks/use-app-config';

type ShareButtonProps = {
  componentToPrintRef?: React.RefObject<HTMLElement | null>;
  title: string;
  body: string;
};

export function ShareButton({
  componentToPrintRef,
  title,
  body,
}: ShareButtonProps) {
  const appConfig = useAppConfig();
  const clipboard = useClipboard();
  const handlePrint = useReactToPrint({
    contentRef: componentToPrintRef,
  });
  const { t } = useTranslation('common');
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogId = useId();
  const copyStatusId = useId();

  const [open, setOpen] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const metadataTitle =
    typeof document !== 'undefined' ? document.title.trim() : '';
  const metadataDescription =
    typeof document !== 'undefined'
      ? (document
          .querySelector('meta[name="description"]')
          ?.getAttribute('content')
          ?.trim() ?? '')
      : '';

  const normalizedTitle = title.trim() || metadataTitle;
  const normalizedBody = body.trim() || metadataDescription;
  const shareSubject =
    normalizedTitle || t('modal.share.check_out_this_resource');

  // SMS: compact message (title + short URL)
  const smsSummary = shareSubject || t('modal.share.check_out_this_resource');
  const smsMessage = [smsSummary, shortUrl].filter(Boolean).join('\n\n');

  // Email: full message (body + URL)
  const emailMessage = [normalizedBody, shortUrl].filter(Boolean).join('\n\n');

  useEffect(() => {
    async function getShortUrl() {
      const id = await shortenUrl(window.location.href, appConfig.tenantId);
      const url = `${window.location.origin}${appConfig.customBasePath}/share/${id}`;
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
        <Share2 className="size-4" aria-hidden="true" />
        {t('call_to_action.share')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          id={dialogId}
          restoreFocusElement={triggerRef.current}
          closeLabel={t('call_to_action.close')}
        >
          <DialogHeader>
            <DialogTitle>{t('modal.share.share_via')}</DialogTitle>
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
                <Facebook className="size-4" aria-hidden="true" />
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
                <Linkedin className="size-4" aria-hidden="true" />
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
                <X className="size-4" aria-hidden="true" />X
                <span className="sr-only">
                  {' '}
                  {t('modal.share.opens_in_new_tab')}
                </span>
              </Button>

              <SmsButton shareMessage={smsMessage} />

              <Button
                variant="outline"
                className="flex gap-1"
                aria-label={`${t('modal.share.email')} ${t('modal.share.opens_in_new_tab')}`}
                onClick={() => {
                  window.open(
                    `mailto:?subject=${encodeURIComponent(
                      shareSubject,
                    )}&body=${encodeURIComponent(emailMessage)}`,
                  );
                }}
              >
                <Mail className="size-4" aria-hidden="true" />
                {t('modal.share.email')}
                <span className="sr-only">
                  {' '}
                  {t('modal.share.opens_in_new_tab')}
                </span>
              </Button>

              <Button
                variant="outline"
                className="flex gap-1"
                onClick={handlePrint}
              >
                <Printer className="size-4" aria-hidden="true" />
                {t('modal.share.print')}
              </Button>
            </div>

            <div className="relative flex">
              <Button
                onClick={() => clipboard.copy(shortUrl)}
                variant="outline"
                className="flex w-full items-center justify-between gap-1"
                aria-label={t('modal.share.copy_link')}
                aria-describedby={copyStatusId}
              >
                {shortUrl}

                {clipboard.copied ? (
                  <CheckIcon className="size-4" aria-hidden="true" />
                ) : (
                  <ClipboardIcon className="size-4" aria-hidden="true" />
                )}
              </Button>
              <span
                id={copyStatusId}
                className="sr-only"
                role="status"
                aria-live="polite"
              >
                {clipboard.copied ? t('modal.share.copied') : ''}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
