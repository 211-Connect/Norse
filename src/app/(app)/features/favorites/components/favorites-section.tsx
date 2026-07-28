'use client';

import { useAtom } from 'jotai';
import { ChevronLeft } from 'lucide-react';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { SearchCardLayoutConfig } from '@/app/(app)/features/search/types/card-layout-config';
import { DirectoryPrintControl } from '@/app/(app)/shared/components/directory-print/directory-print-control';
import { useDefaultDirectoryPdfDocument } from '@/app/(app)/shared/components/directory-print/use-default-directory-pdf-document';
import { Link } from '@/app/(app)/shared/components/link';
import { ShareButton } from '@/app/(app)/shared/components/share-button';
import { Badge } from '@/app/(app)/shared/components/ui/badge';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/(app)/shared/components/ui/tooltip';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';
import { cn, withOptionalTrailingSlash } from '@/app/(app)/shared/lib/utils';
import { getFavoriteList } from '@/app/(app)/shared/serverActions/favorites/getFavoriteList';
import { favoriteListWithFavoritesAtom } from '@/app/(app)/shared/store/favorites';
import { fontSans } from '@/app/(app)/shared/styles/fonts';
import { favoriteListToPrintableDirectory } from '@/app/(app)/shared/utils/printable-directory-transformers';

import { DeleteFavoriteListButton } from './delete-favorite-list-button';
import { Favorite } from './favorite';
import { NoFavoritesCard } from './no-favorites-card';
import { PurgeFavoriteListButton } from './purge-favorite-list-button';
import { SaveFavoriteListToDirectoryButton } from './save-favorite-list-to-directory';
import { UpdateFavoriteListButton } from './update-favorite-list-button';

type FavoritesSectionProps = {
  cardLayout: SearchCardLayoutConfig;
};

export function FavoritesSection({ cardLayout }: FavoritesSectionProps) {
  const { t } = useTranslation('page-list');
  const appConfig = useAppConfig();
  const [favoriteList, setFavoriteList] = useAtom(
    favoriteListWithFavoritesAtom,
  );
  const componentToPrint = useRef<HTMLDivElement>(null);
  const { stringifiedSearchParams } = useClientSearchParams();
  const loadPrintableData = useCallback(
    async (locale: string) => {
      const freshList = await getFavoriteList(
        favoriteList.id,
        locale,
        appConfig.tenantId,
      );

      return favoriteListToPrintableDirectory(
        freshList ?? favoriteList,
        locale,
      );
    },
    [favoriteList, appConfig.tenantId],
  );
  const renderPdfDocument = useDefaultDirectoryPdfDocument();

  const handleRemoveFromList = (_listId: string, favoriteId: string) => {
    // Optimistically update the local atom by filtering out the removed favorite
    setFavoriteList((prev) => ({
      ...prev,
      favorites:
        prev.favorites?.filter((favorite) => favorite._id !== favoriteId) || [],
    }));
  };

  const handlePurge = () => {
    setFavoriteList((prev) => ({ ...prev, favorites: [] }));
  };

  return (
    <div className="flex w-full flex-col p-2.5 lg:max-w-137.5 lg:pl-5">
      {/* Row 1: navigation + list actions */}
      <div className="flex items-center justify-between print:hidden">
        {favoriteList.viewingAsOwner ? (
          <Link
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'items-center gap-1',
            )}
            href={withOptionalTrailingSlash(
              `/favorites${stringifiedSearchParams}`,
            )}
            data-testid="back-to-favorites"
          >
            <ChevronLeft className="size-4" />
            {t('back_to_favorites')}
          </Link>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DirectoryPrintControl
                    loadData={loadPrintableData}
                    variant="icon"
                    renderDocument={renderPdfDocument}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('tooltips.print')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SaveFavoriteListToDirectoryButton
                    favoriteListId={favoriteList.id}
                    favoriteListName={favoriteList.name}
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

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <UpdateFavoriteListButton
                    id={favoriteList.id}
                    name={favoriteList.name}
                    description={favoriteList.description}
                    privacy={favoriteList.privacy}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('tooltips.update')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <PurgeFavoriteListButton
                    id={favoriteList.id}
                    onPurge={handlePurge}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('tooltips.purge')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DeleteFavoriteListButton
                    id={favoriteList.id}
                    name={favoriteList.name}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('tooltips.delete')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Row 2: list name + privacy badge */}
      <div className="mt-3 flex items-center gap-2">
        <h1 className="text-2xl leading-tight font-semibold">
          {favoriteList.name}
        </h1>
        <Badge variant="outline" className="bg-white">
          {t(`list.${favoriteList?.privacy?.toLowerCase()}`, {
            ns: 'common',
          })}
        </Badge>
      </div>

      {favoriteList.description && (
        <p className="text-muted-foreground mt-1 text-sm">
          {favoriteList.description}
        </p>
      )}

      {/* Share button row (public lists only) */}
      {favoriteList.privacy === 'PUBLIC' && (
        <div className="mt-2 flex justify-end print:hidden">
          <ShareButton
            title={favoriteList.name}
            body={favoriteList.description}
            componentToPrintRef={componentToPrint}
          />
        </div>
      )}

      <div
        className={cn('mt-2 flex flex-col gap-2 font-sans', fontSans.variable)}
        ref={componentToPrint}
      >
        {favoriteList?.favorites?.map((list) => {
          return (
            <Favorite
              key={list._id}
              data={list}
              cardLayout={cardLayout}
              currentListId={favoriteList.id}
              onRemoveFromList={handleRemoveFromList}
            />
          );
        })}

        {favoriteList?.favorites?.length === 0 && <NoFavoritesCard />}
      </div>
    </div>
  );
}
