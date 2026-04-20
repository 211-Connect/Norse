'use client';

import {
  CheckIcon,
  ClipboardIcon,
  Linkedin,
  Mail,
  Printer,
  Share2,
} from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
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

type ShareButtonProps = {
  componentToPrintRef?: React.RefObject<HTMLElement | null>;
  title: string;
  body: string;
};

const SHARE_ACTION_BUTTON_CLASSNAME =
  'flex min-w-0 justify-center gap-2 focus-visible:ring-inset focus-visible:ring-offset-0';

const HIDDEN_FOCUSABLE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]',
].join(', ');

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
  const syncingRef = useRef(false);
  const elementStateRef = useRef(
    new Map<
      HTMLElement,
      {
        ariaHidden: string | null;
        inert: boolean;
        inertAttribute: string | null;
        tabIndexAttribute: string | null;
      }
    >(),
  );

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

  const debugLog = useCallback((message: string, details?: unknown) => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    if (details === undefined) {
      console.debug(`[share-button] ${message}`);
      return;
    }

    console.debug(`[share-button] ${message}`, details);
  }, []);

  useEffect(() => {
    async function getShortUrl() {
      const id = await shortenUrl(window.location.href, appConfig.tenantId);
      const url = `${window.location.origin}${appConfig.customBasePath}/share/${id}`;
      setShortUrl(url);
    }

    getShortUrl();
  }, [appConfig.customBasePath, appConfig.tenantId]);

  const rememberElementState = useCallback((element: HTMLElement) => {
    if (elementStateRef.current.has(element)) {
      return;
    }

    elementStateRef.current.set(element, {
      ariaHidden: element.getAttribute('aria-hidden'),
      inert: element.inert,
      inertAttribute: element.getAttribute('inert'),
      tabIndexAttribute: element.getAttribute('tabindex'),
    });
  }, []);

  const restoreManagedElements = useCallback(() => {
    elementStateRef.current.forEach((state, element) => {
      if (state.ariaHidden === null) {
        element.removeAttribute('aria-hidden');
      } else {
        element.setAttribute('aria-hidden', state.ariaHidden);
      }

      element.inert = state.inert;

      if (state.inertAttribute === null) {
        element.removeAttribute('inert');
      } else {
        element.setAttribute('inert', state.inertAttribute);
      }

      if (state.tabIndexAttribute === null) {
        element.removeAttribute('tabindex');
      } else {
        element.setAttribute('tabindex', state.tabIndexAttribute);
      }
    });

    elementStateRef.current.clear();
  }, []);

  const syncHiddenTree = useCallback(() => {
    if (syncingRef.current) {
      return;
    }

    const dialogElement = document.getElementById(dialogId);

    if (!dialogElement) {
      debugLog('sync skipped: dialog element not found');
      return;
    }

    syncingRef.current = true;

    try {
      const overlayElement = dialogElement.previousElementSibling;
      const keepVisible = new Set<Element>([dialogElement]);

      if (overlayElement) {
        keepVisible.add(overlayElement);
      }

      const managedElements = new Set<HTMLElement>();

      const hiddenElements = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-aria-hidden="true"], [aria-hidden="true"]',
        ),
      ).filter((element) => !keepVisible.has(element));

      hiddenElements.forEach((element) => {
        rememberElementState(element);
        element.inert = true;
        element.setAttribute('inert', '');
        managedElements.add(element);
      });

      const hiddenFocusableElements = new Set<HTMLElement>();

      hiddenElements.forEach((element) => {
        if (element.matches(HIDDEN_FOCUSABLE_SELECTOR)) {
          hiddenFocusableElements.add(element);
        }

        element
          .querySelectorAll<HTMLElement>(HIDDEN_FOCUSABLE_SELECTOR)
          .forEach((child) => hiddenFocusableElements.add(child));
      });

      Array.from(
        document.querySelectorAll<HTMLElement>('[data-radix-focus-guard]'),
      ).forEach((element) => hiddenFocusableElements.add(element));

      hiddenFocusableElements.forEach((element) => {
        rememberElementState(element);
        if (element.getAttribute('tabindex') !== '-1') {
          element.setAttribute('tabindex', '-1');
        }
        managedElements.add(element);
      });

      Array.from(elementStateRef.current.keys()).forEach((element) => {
        if (!managedElements.has(element)) {
          const state = elementStateRef.current.get(element);

          if (!state) {
            return;
          }

          if (state.ariaHidden === null) {
            element.removeAttribute('aria-hidden');
          } else {
            element.setAttribute('aria-hidden', state.ariaHidden);
          }

          element.inert = state.inert;

          if (state.inertAttribute === null) {
            element.removeAttribute('inert');
          } else {
            element.setAttribute('inert', state.inertAttribute);
          }

          if (state.tabIndexAttribute === null) {
            element.removeAttribute('tabindex');
          } else {
            element.setAttribute('tabindex', state.tabIndexAttribute);
          }

          elementStateRef.current.delete(element);
        }
      });

      debugLog('sync complete', {
        hiddenElements: hiddenElements.length,
        hiddenFocusableElements: hiddenFocusableElements.size,
        managedElements: managedElements.size,
      });
    } finally {
      syncingRef.current = false;
    }
  }, [debugLog, dialogId, rememberElementState]);

  useEffect(() => {
    debugLog('open state changed', { open });

    if (!open) {
      restoreManagedElements();
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      syncHiddenTree();
    });

    const observer = new MutationObserver(() => {
      debugLog('mutation observed');
      syncHiddenTree();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-hidden', 'data-aria-hidden'],
    });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
      restoreManagedElements();
    };
  }, [debugLog, open, restoreManagedElements, syncHiddenTree]);

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
            <DialogDescription className="sr-only">
              {t('modal.share.share_via')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-w-0 flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className={SHARE_ACTION_BUTTON_CLASSNAME}
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
                className={SHARE_ACTION_BUTTON_CLASSNAME}
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
                className={SHARE_ACTION_BUTTON_CLASSNAME}
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
                className={SHARE_ACTION_BUTTON_CLASSNAME}
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
                className={SHARE_ACTION_BUTTON_CLASSNAME}
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
                className="flex w-full min-w-0 items-center justify-between gap-1 focus-visible:ring-inset focus-visible:ring-offset-0"
                aria-label={t('modal.share.copy_link')}
                aria-describedby={copyStatusId}
              >
                <span className="min-w-0 truncate text-left">{shortUrl}</span>

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
