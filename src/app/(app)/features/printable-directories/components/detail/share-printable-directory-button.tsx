'use client';

import { Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/(app)/shared/components/ui/tooltip';
import { useClipboard } from '@/app/(app)/shared/hooks/use-clipboard';
import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';
import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';

type SharePrintableDirectoryButtonProps = {
  directory: PrintableDirectoryResponseDto;
  locale: string;
};

export function SharePrintableDirectoryButton({
  directory,
  locale,
}: SharePrintableDirectoryButtonProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const clipboard = useClipboard();

  if (
    directory.resourceLayout === 'custom-search' ||
    directory.resourceLayout === 'custom-resource'
  ) {
    return null;
  }

  const handleShare = () => {
    if (!directory.slug) {
      return;
    }

    const shareUrl = withOptionalCustomBasePath(
      `${window.location.origin}/${locale}?directory=${encodeURIComponent(directory.slug)}`,
    );

    clipboard.copy(shareUrl);
    toast.success(t('share_link_copied', { ns: 'page-directories' }));
  };

  if (!directory.slug) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled
              >
                <Share2 className="size-4" aria-hidden="true" />
                {t('call_to_action.share', { ns: 'common' })}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {t('share_slug_missing_tooltip', { ns: 'page-directories' })}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="gap-2"
      onClick={handleShare}
      data-testid="share-printable-directory-btn"
    >
      <Share2 className="size-4" aria-hidden="true" />
      {t('call_to_action.share', { ns: 'common' })}
    </Button>
  );
}
