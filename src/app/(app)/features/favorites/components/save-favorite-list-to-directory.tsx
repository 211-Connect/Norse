'use client';

import { SaveSourceToDirectoryButton } from '@/app/(app)/shared/components/printable-directories/save-source-to-directory-button';

type SaveFavoriteListToDirectoryButtonProps = {
  favoriteListId: string;
  favoriteListName: string;
  disabled?: boolean;
};

export function SaveFavoriteListToDirectoryButton({
  favoriteListId,
  disabled,
}: SaveFavoriteListToDirectoryButtonProps) {
  return (
    <SaveSourceToDirectoryButton
      kind="favorites_list"
      triggerMode="icon"
      triggerDisabled={disabled}
      sourcePayload={{
        type: 'favorites_list',
        favoritesListId: favoriteListId,
      }}
    />
  );
}
