'use client';

import { SaveSourceToDirectoryButton } from '@/app/(app)/shared/components/printable-directories/save-source-to-directory-button';

type SaveQueryToDirectoryButtonProps = {
  queryTitle: string;
  queryParams: Record<string, unknown>;
};

export function SaveQueryToDirectoryButton({
  queryTitle,
  queryParams,
}: SaveQueryToDirectoryButtonProps) {
  return (
    <SaveSourceToDirectoryButton
      kind="query"
      triggerMode="button"
      sourcePayload={{
        type: 'query',
        query: {
          title: queryTitle,
          params: queryParams,
        },
      }}
    />
  );
}
