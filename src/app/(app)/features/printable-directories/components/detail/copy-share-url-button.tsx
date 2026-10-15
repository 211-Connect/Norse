'use client';

import { CheckIcon, CopyIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { useClipboard } from '@/app/(app)/shared/hooks/use-clipboard';
import { cn } from '@/app/(app)/shared/lib/utils';

type CopyShareUrlButtonProps = {
  url: string;
  className?: string;
};

/** Icon button copying a directory's share URL. Text-line sized, so it
 *  doesn't stretch the row it sits in. */
export function CopyShareUrlButton({
  url,
  className,
}: CopyShareUrlButtonProps) {
  const { t } = useTranslation('page-directories');
  const clipboard = useClipboard();

  const handleCopy = async () => {
    await clipboard.copy(url);
    toast.success(t('share_link_copied'));
  };

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={cn('size-5 shrink-0 rounded-sm', className)}
      onClick={handleCopy}
      aria-label={t('copy_link_button')}
      title={t('copy_link_button')}
    >
      {clipboard.copied ? (
        <CheckIcon className="size-3.5" aria-hidden="true" />
      ) : (
        <CopyIcon className="size-3.5" aria-hidden="true" />
      )}
    </Button>
  );
}
