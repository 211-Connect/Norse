'use client';

import { SaveSourceToDirectoryButton } from '@/app/(app)/shared/components/printable-directories/save-source-to-directory-button';
import {
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@radix-ui/react-tooltip';
import { t } from 'i18next';
import { Tooltip } from '@radix-ui/react-tooltip';
import { canAccessPrintableDirectories } from '@/app/(app)/shared/utils/canAccessPrintableDirectories';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useSession } from 'next-auth/react';

type SaveFavoriteListToDirectoryButtonProps = {
  favoriteListId: string;
  favoriteListName: string;
  disabled?: boolean;
};

export function SaveFavoriteListToDirectoryButton({
  favoriteListId,
  disabled,
}: SaveFavoriteListToDirectoryButtonProps) {
  const session = useSession();
  const appConfig = useAppConfig();

  const hasAccess = canAccessPrintableDirectories(
    session.data?.user?.email,
    appConfig,
  );

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
