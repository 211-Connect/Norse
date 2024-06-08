import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '../ui/button';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { useAppConfig } from '@/hooks/use-app-config';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import ShortUrlAdapter from './adapters/short-url-adapter';
import useClipboard from '@/hooks/use-clipboard';
import useAuthPrompt from '@/hooks/use-auth-prompt';
import useSms from './use-sms';
import {
  AtSign,
  LinkIcon,
  MessageSquareText,
  Printer,
  Share,
} from 'lucide-react';
import FacebookIcon from '../icons/facebook';
import XIcon from '../icons/x';

export function ShareButton({
  title,
  body,
  printFn,
}: {
  title: string;
  body: string;
  printFn: () => void;
}) {
  const { t } = useTranslation('common');
  const hasRun = useRef(false);
  const clipboard = useClipboard({ timeout: 500 });
  const session = useSession();
  const appConfig = useAppConfig();
  const [shortUrl, setShortUrl] = useState('');
  const { open: openAuthPrompt, AuthPrompt } = useAuthPrompt();
  const { SendSmsDialog, open: openSmsDialog } = useSms(
    title + '\n' + shortUrl,
  );

  useEffect(() => {
    (async () => {
      if (hasRun.current) return;
      hasRun.current = true;
      const shortUrlAdapter = ShortUrlAdapter();
      const { url } = await shortUrlAdapter.createShortUrl(
        window.location.href,
      );
      setShortUrl(url);
    })();
  }, []);

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="gap-1">
            <Share className="size-4" />
            {t('call_to_action.share', { ns: 'common' })}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modal.share.share_via')}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                shortUrl,
              )}`}
              target="_blank"
              className={cn(
                buttonVariants({
                  variant: 'outline',
                }),
                'flex gap-1',
              )}
            >
              <FacebookIcon className="size-4" />
              {t('modal.share.facebook')}
            </Link>

            <Link
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                title + '\n' + shortUrl,
              )}`}
              target="_blank"
              className={cn(
                buttonVariants({
                  variant: 'outline',
                }),
                'flex gap-1',
              )}
            >
              <XIcon className="size-4" />
              {t('modal.share.twitter')}
            </Link>

            <Button
              variant="outline"
              className="flex gap-1"
              onClick={() => {
                if (!('sms' in appConfig.features)) {
                  const userAgent = navigator.userAgent;
                  const isIOS = /iPhone|iPad|iPod|Macintosh/i.test(userAgent);
                  let smsLink = '';

                  if (isIOS) {
                    smsLink = `sms:&body=\n${encodeURIComponent(
                      body + '\n\n' + shortUrl,
                    )}`;
                  } else {
                    smsLink = `sms:?body=\n${encodeURIComponent(
                      body + '\n\n' + shortUrl,
                    )}`;
                  }

                  window.location.href = smsLink;
                } else if (!session.data) {
                  openAuthPrompt();
                } else {
                  openSmsDialog();
                }
              }}
            >
              <MessageSquareText className="size-4" />
              {t('modal.share.sms')}
            </Button>

            <Link
              href={`mailto:?subject=${encodeURIComponent(
                title,
              )}&body=${encodeURIComponent(body + '\n\n' + shortUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({
                  variant: 'outline',
                }),
                'flex gap-1',
              )}
            >
              <AtSign className="size-4" />
              {t('modal.share.email')}
            </Link>

            <Button
              className="flex gap-1"
              variant="outline"
              onClick={() => printFn?.()}
            >
              <Printer className="size-4" />
              {t('modal.share.print')}
            </Button>
          </div>

          <div className="flex flex-col gap-1">
            <p>{t('modal.share.copy_link')}</p>
            <div className="flex">
              <div className="relative w-full">
                <LinkIcon className="absolute left-1 top-1/2 size-4 -translate-y-1/2" />
                <Input className="pl-6" value={shortUrl} readOnly />
                <Button
                  className="absolute right-0 top-0"
                  color={clipboard.copied ? 'green' : 'primary'}
                  onClick={() => clipboard.copy(shortUrl)}
                >
                  {clipboard.copied
                    ? t('modal.share.copied')
                    : t('modal.share.copy')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AuthPrompt />
      <SendSmsDialog />
    </>
  );
}
