import { useClipboard } from '@/shared/hooks/use-clipboard';
import { CheckIcon, ClipboardIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

type CopyBadgeProps = {
  children?: ReactNode;
  text: string;
  href?: string;
  target?: string;
  className?: string;
  truncate?: boolean;
};

export function CopyBadge({
  children,
  text,
  href,
  target,
  truncate = false,
  className,
}: CopyBadgeProps) {
  const { t } = useTranslation('common');
  const { copied, copy } = useClipboard({ timeout: 500 });

  const WrapperComponent = href ? Link : 'div';

  const handleCopy = (e) => {
    e.preventDefault();
    copy(text);
  };

  return (
    <WrapperComponent
      href={href}
      target={target}
      className={cn(
        'group overflow-hidden text-xs font-semibold hover:underline',
        truncate && 'flex items-center gap-1',
        className,
      )}
    >
      <span className={cn(truncate && 'truncate')}>{children}</span>

      <TooltipProvider>
        <Tooltip open={copied}>
          <TooltipTrigger
            className={cn('size-4 shrink-0', !truncate && 'ml-1 inline')}
            onClick={handleCopy}
            aria-label="Copy"
          >
            {copied ? (
              <CheckIcon className={cn('size-4', !truncate && 'mt-[2px]')} />
            ) : (
              <ClipboardIcon
                className={cn(
                  'hidden size-4 group-hover:block',
                  !truncate && 'mt-[2px]',
                )}
              />
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('modal.share.copied')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </WrapperComponent>
  );
}
