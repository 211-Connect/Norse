'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { DirectoryPrintControl } from '@/app/(app)/shared/components/directory-print/directory-print-control';
import { useDefaultDirectoryPdfDocument } from '@/app/(app)/shared/components/directory-print/use-default-directory-pdf-document';
import { ShareButton } from '@/app/(app)/shared/components/share-button';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { getFavoriteList } from '@/app/(app)/shared/serverActions/favorites/getFavoriteList';
import { favoriteListToPrintableDirectory } from '@/app/(app)/shared/utils/printable-directory-transformers';
import { FavoriteListState } from '@/types/favorites';

import { DeleteFavoriteListButton } from './delete-favorite-list-button';
import { PurgeFavoriteListButton } from './purge-favorite-list-button';
import { SaveFavoriteListToDirectoryButton } from './save-favorite-list-to-directory';
import { TooltipIconButton } from './tooltip-icon-button';
import { UpdateFavoriteListButton } from './update-favorite-list-button';
import { useSession } from 'next-auth/react';

type FavoriteListActionsProps = {
  favoriteList: FavoriteListState;
  onPurge: () => void;
};

export function FavoriteListActions({
  favoriteList,
  onPurge,
}: FavoriteListActionsProps) {
  const { t } = useTranslation('page-list');
  const appConfig = useAppConfig();
  const renderPdfDocument = useDefaultDirectoryPdfDocument();
  const session = useSession();
  const viewingAsOwner = session?.data?.user?.id === favoriteList.ownerId;

  const loadPrintableData = useCallback(
    async (locale: string) => {
      const freshList = await getFavoriteList(
        favoriteList.id,
        locale,
        appConfig.tenantId,
      );

      return favoriteListToPrintableDirectory(freshList ?? favoriteList);
    },
    [favoriteList, appConfig.tenantId],
  );

  return (
    <div className="flex items-center gap-2">
      <TooltipIconButton label={t('tooltips.print')}>
        <DirectoryPrintControl
          loadData={loadPrintableData}
          variant="icon"
          renderDocument={renderPdfDocument}
        />
      </TooltipIconButton>

      {viewingAsOwner && (
        <SaveFavoriteListToDirectoryButton
          favoriteListId={favoriteList.id}
          favoriteListName={favoriteList.name}
        />
      )}

      {favoriteList.privacy === 'PUBLIC' && (
        <TooltipIconButton label={t('call_to_action.share')}>
          <ShareButton
            variant="icon"
            title={favoriteList.name}
            body={favoriteList.description}
          />
        </TooltipIconButton>
      )}

      {viewingAsOwner && (
        <>
          <TooltipIconButton label={t('tooltips.update')}>
            <UpdateFavoriteListButton
              id={favoriteList.id}
              name={favoriteList.name}
              description={favoriteList.description}
              privacy={favoriteList.privacy}
            />
          </TooltipIconButton>

          <TooltipIconButton label={t('tooltips.purge')}>
            <PurgeFavoriteListButton id={favoriteList.id} onPurge={onPurge} />
          </TooltipIconButton>

          <TooltipIconButton label={t('tooltips.delete')}>
            <DeleteFavoriteListButton
              id={favoriteList.id}
              name={favoriteList.name}
            />
          </TooltipIconButton>
        </>
      )}
    </div>
  );
}
