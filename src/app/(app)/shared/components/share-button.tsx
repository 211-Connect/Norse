'use client';

import { CheckIcon, ClipboardIcon, Mail, Share2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppConfig } from '../hooks/use-app-config';
import { useClipboard } from '../hooks/use-clipboard';
import { cn, withOptionalCustomBasePath } from '../lib/utils';
import { shortenUrl } from '../serverActions/shortUrl/shortenUrl';
import { Facebook } from './icons/facebook';
import { LinkedIn } from './icons/linkedin';
import { X } from './icons/x';
import { SmsButton } from './sms-button';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

type ShareButtonProps = {
  title: string;
  body: string;
  variant?: 'icon' | 'icon-text';
  testId?: string;
};

const SHARE_ACTION_BUTTON_CLASSNAME =
  'flex min-w-0 justify-center gap-2 focus-visible:ring-inset focus-visible:ring-offset-0';

export function ShareButton({
  title,
  body,
  variant = 'icon-text',
  testId = 'share-btn',
}: ShareButtonProps) {
  const appConfig = useAppConfig();
  const clipboard = useClipboard();
  const { t } = useTranslation('common');
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogId = useId();
  const copyStatusId = useId();

  const [open, setOpen] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const [isShortUrlLoading, setIsShortUrlLoading] = useState(false);
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
    // Only request a short URL once the dialog is opened, not on every mount.
    if (!open || shortUrl) return;

    let isCancelled = false;

    async function getShortUrl() {
      setIsShortUrlLoading(true);
      const id = await shortenUrl(window.location.href, appConfig.tenantId);
      if (isCancelled) return;
      const url = withOptionalCustomBasePath(
        `${window.location.origin}/share/${id}`,
      );
      setShortUrl(url);
      setIsShortUrlLoading(false);
    }

    getShortUrl();

    return () => {
      isCancelled = true;
    };
  }, [open, shortUrl, appConfig.tenantId]);

  return (
    <>
      <Button
        ref={triggerRef}
        size={variant === 'icon' ? 'icon' : 'default'}
        className={variant === 'icon' ? undefined : 'flex gap-1'}
        variant="outline"
        onClick={() => setOpen(true)}
        data-testid={testId}
        aria-controls={dialogId}
        aria-haspopup="dialog"
        aria-label={
          title
            ? `${t('call_to_action.share')} ${title}`
            : t('call_to_action.share')
        }
      >
        <Share2 className="size-4" aria-hidden="true" />
        {variant !== 'icon' && t('call_to_action.share')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          id={dialogId}
          restoreFocusElement={triggerRef.current}
          closeLabel={t('call_to_action.close')}
          data-testid="share-dialog"
        >
          <DialogHeader>
            <DialogTitle>{t('modal.share.share_via')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('modal.share.share_via')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-w-0 grid-cols-1 gap-2 md:grid-cols-6">
            <Button
              asChild
              variant="outline"
              className={cn(SHARE_ACTION_BUTTON_CLASSNAME, 'md:col-span-2')}
              aria-label={`${t('modal.share.facebook')} ${t('modal.share.opens_in_new_tab')}`}
            >
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  shortUrl,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="size-4" aria-hidden="true" />
                <span className="sr-only">
                  {t('modal.share.facebook')}{' '}
                  {t('modal.share.opens_in_new_tab')}
                </span>
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              className={cn(SHARE_ACTION_BUTTON_CLASSNAME, 'md:col-span-2')}
              aria-label={`${t('modal.share.linkedin')} ${t('modal.share.opens_in_new_tab')}`}
            >
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shortUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedIn className="size-4" aria-hidden="true" />
                <span className="sr-only">
                  {t('modal.share.linkedin')}{' '}
                  {t('modal.share.opens_in_new_tab')}
                </span>
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              className={cn(SHARE_ACTION_BUTTON_CLASSNAME, 'md:col-span-2')}
              aria-label={`X ${t('modal.share.opens_in_new_tab')}`}
            >
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  title + '\n' + shortUrl,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">
                  X {t('modal.share.opens_in_new_tab')}
                </span>
              </a>
            </Button>

            <SmsButton shareMessage={smsMessage} className="md:col-span-3" />

            <Button
              asChild
              variant="outline"
              className={cn(SHARE_ACTION_BUTTON_CLASSNAME, 'md:col-span-3')}
              aria-label={`${t('modal.share.email')} ${t('modal.share.opens_in_new_tab')}`}
            >
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  shareSubject,
                )}&body=${encodeURIComponent(emailMessage)}`}
              >
                <Mail className="size-4" aria-hidden="true" />
                {t('modal.share.email')}
                <span className="sr-only">
                  {' '}
                  {t('modal.share.opens_in_new_tab')}
                </span>
              </a>
            </Button>

            <div className="relative flex md:col-span-6">
              <Button
                onClick={() => shortUrl && clipboard.copy(shortUrl)}
                variant="outline"
                className="flex w-full min-w-0 items-center justify-between gap-1 focus-visible:ring-offset-0 focus-visible:ring-inset"
                aria-label={t('modal.share.copy_link')}
                aria-describedby={copyStatusId}
                aria-busy={isShortUrlLoading}
                disabled={!shortUrl}
                data-testid="copy-short-url-btn"
              >
                <span className="min-w-0 truncate text-left">
                  {shortUrl || '...'}
                </span>

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
