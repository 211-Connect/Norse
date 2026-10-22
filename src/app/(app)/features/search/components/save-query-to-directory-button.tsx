'use client';

import { SaveSourceToDirectoryButton } from '@/app/(app)/shared/components/printable-directories/save-source-to-directory-button';
import { PrintableDirectorySearchContext } from '@/app/(app)/shared/hooks/use-printable-directory-search-context';

type SaveQueryToDirectoryButtonProps = {
  queryTitle: string;
  queryParams: Record<string, unknown>;
  directoryContext: PrintableDirectorySearchContext | null;
  disabled?: boolean;
};

export function SaveQueryToDirectoryButton({
  queryTitle,
  queryParams,
  directoryContext,
  disabled,
}: SaveQueryToDirectoryButtonProps) {
  return (
    <SaveSourceToDirectoryButton
      kind="query"
      triggerMode="button"
      triggerDisabled={disabled}
      directoryContext={directoryContext}
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
