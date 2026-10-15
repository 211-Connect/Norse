'use client';

import { SaveSourceToDirectoryButton } from '@/app/(app)/shared/components/printable-directories/save-source-to-directory-button';
import {
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@radix-ui/react-tooltip';
import { t } from 'i18next';
import { Tooltip } from '@radix-ui/react-tooltip';
import { usePrintableDirectoryAccess } from '@/app/(app)/shared/hooks/use-printable-directory-capability';

type SaveFavoriteListToDirectoryButtonProps = {
  favoriteListId: string;
  favoriteListName: string;
  disabled?: boolean;
};

export function SaveFavoriteListToDirectoryButton({
  favoriteListId,
  disabled,
}: SaveFavoriteListToDirectoryButtonProps) {
  const { canAccess: hasAccess } = usePrintableDirectoryAccess();

  if (!hasAccess) {
    return null;
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <SaveSourceToDirectoryButton
              kind="favorites_list"
              triggerMode="icon"
              triggerDisabled={disabled}
              sourcePayload={{
                type: 'favorites_list',
                favoritesListId: favoriteListId,
              }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {t('printable_directories.save_list.button_label', {
              ns: 'common',
            })}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
