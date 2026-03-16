'use client';

import { useClipboard } from '@/app/(app)/shared/hooks/use-clipboard';
import { CheckIcon, ClipboardIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/(app)/shared/components/ui/tooltip';
import { ReactNode, useId } from 'react';
import { cn } from '@/app/(app)/shared/lib/utils';
import { useTranslation } from 'react-i18next';

import { LocalizedLink } from './LocalizedLink';

type CopyBadgeProps = {
  children?: ReactNode;
  text: string;
  href?: string;
  target?: string;
  className?: string;
  truncate?: boolean;
  copyLabel: string;
  linkAriaLabel?: string;
};

export function CopyBadge({
  children,
  text,
  href,
  target,
  truncate = false,
  className,
  copyLabel,
  linkAriaLabel,
}: CopyBadgeProps) {
  const { t } = useTranslation('common');
  const { copied, copy } = useClipboard({ timeout: 500 });
  const statusId = useId();

  const handleCopy = () => {
    copy(text);
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-1 overflow-hidden text-xs font-semibold',
        className,
      )}
    >
      {href ? (
        <LocalizedLink
          href={href}
          target={target}
          aria-label={linkAriaLabel}
          className={cn('overflow-hidden hover:underline', truncate && 'truncate')}
        >
          <span className={cn(truncate && 'truncate')}>{children}</span>
        </LocalizedLink>
      ) : (
        <span className={cn('overflow-hidden', truncate && 'truncate')}>
          {children}
        </span>
      )}

      <TooltipProvider>
        <Tooltip open={copied}>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex size-4 shrink-0 items-center justify-center rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={handleCopy}
              aria-label={copyLabel}
              aria-describedby={statusId}
            >
              {copied ? (
                <CheckIcon className="size-4" />
              ) : (
                <ClipboardIcon className="size-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('modal.share.copied')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span id={statusId} className="sr-only" role="status" aria-live="polite">
        {copied ? t('modal.share.copied') : ''}
      </span>
    </div>
  );
}
