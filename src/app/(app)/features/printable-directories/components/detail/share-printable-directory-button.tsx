'use client';

import { Share2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/(app)/shared/components/ui/tooltip';
import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';

import { ShareDirectoryDialog } from './share-directory-dialog';

type SharePrintableDirectoryButtonProps = {
  directory: PrintableDirectoryResponseDto;
  locale: string;
};

export function SharePrintableDirectoryButton({
  directory,
  locale,
}: SharePrintableDirectoryButtonProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const [open, setOpen] = useState(false);

  if (
    directory.resourceLayout === 'custom-search' ||
    directory.resourceLayout === 'custom-resource'
  ) {
    return null;
  }

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
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => setOpen(true)}
        data-testid="share-printable-directory-btn"
      >
        <Share2 className="size-4" aria-hidden="true" />
        {t('call_to_action.share', { ns: 'common' })}
      </Button>

      <ShareDirectoryDialog
        open={open}
        onOpenChange={setOpen}
        directory={directory}
        locale={locale}
      />
    </>
  );
}
