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

type CopyBadgeProps = {
  children?: ReactNode;
  text: string;
  href?: string;
};

export function CopyBadge({ children, text, href }: CopyBadgeProps) {
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
      className="group flex items-center gap-1 truncate text-xs font-semibold hover:underline"
    >
      {children}

      <TooltipProvider>
        <Tooltip open={copied}>
          <TooltipTrigger
            className="w-4 shrink-0"
            onClick={handleCopy}
            aria-label="Copy"
          >
            {copied ? (
              <CheckIcon className="size-4" />
            ) : (
              <ClipboardIcon className="hidden size-4 group-hover:block" />
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
