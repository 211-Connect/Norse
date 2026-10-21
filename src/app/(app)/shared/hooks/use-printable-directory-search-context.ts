'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  PrintableDirectoryResponseDto,
  PrintableDirectorySectionResponseDto,
  PrintableDirectorySourceResponseDto,
} from '@/lib/api/generated/data-contracts';

import { getPrintableDirectoryById } from '../serverActions/printableDirectories/getPrintableDirectoryById';
import {
  PRINTABLE_DIRECTORY_CONTEXT_PARAMS,
  withoutPrintableDirectoryContext,
} from '../utils/printableDirectorySearchContext';
import { useAppConfig } from './use-app-config';
import { usePrintableDirectoryAccess } from './use-printable-directory-capability';

export type PrintableDirectorySearchContext = {
  directory: PrintableDirectoryResponseDto;
  section: PrintableDirectorySectionResponseDto;
  /** The query source being edited; null when adding a new one. */
  source: PrintableDirectorySourceResponseDto | null;
  /** 0-based position of `source` in its section; -1 when adding. */
  sourceIndex: number;
};

type LoadedDirectory = {
  id: string;
  directory: PrintableDirectoryResponseDto | null;
};

/**
 * The printable directory section (and source) the search page is saving
 * into, resolved from the `pdid`/`pdsid`/`pdsrcid` URL params. `context` is
 * null when the params are absent or don't resolve (deleted section, no
 * access); `dismiss` drops the params so Save goes back to its normal
 * pick-a-directory behavior.
 */
export function usePrintableDirectorySearchContext() {
  const appConfig = useAppConfig();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { canAccess } = usePrintableDirectoryAccess();

  const directoryId =
    searchParams?.get(PRINTABLE_DIRECTORY_CONTEXT_PARAMS.directoryId) ?? '';
  const sectionId =
    searchParams?.get(PRINTABLE_DIRECTORY_CONTEXT_PARAMS.sectionId) ?? '';
  const sourceId =
    searchParams?.get(PRINTABLE_DIRECTORY_CONTEXT_PARAMS.sourceId) ?? '';

  const [loaded, setLoaded] = useState<LoadedDirectory | null>(null);

  useEffect(() => {
    if (!canAccess || !directoryId) return;

    let active = true;

    void getPrintableDirectoryById(directoryId, appConfig.tenantId).then(
      (directory) => {
        if (active) setLoaded({ id: directoryId, directory });
      },
    );

    return () => {
      active = false;
    };
  }, [canAccess, directoryId, appConfig.tenantId]);

  const context = useMemo<PrintableDirectorySearchContext | null>(() => {
    if (!directoryId || !sectionId || loaded?.id !== directoryId) return null;

    const directory = loaded.directory;
    const section = directory?.sections.find((item) => item.id === sectionId);
    if (!directory || !section) return null;

    const sourceIndex = sourceId
      ? section.sources.findIndex(
          (item) => item.id === sourceId && item.type === 'query',
        )
      : -1;

    return {
      directory,
      section,
      source: sourceIndex >= 0 ? section.sources[sourceIndex] : null,
      sourceIndex,
    };
  }, [directoryId, sectionId, sourceId, loaded]);

  const isLoading =
    canAccess && Boolean(directoryId) && loaded?.id !== directoryId;

  const dismiss = useCallback(() => {
    const nextQuery = withoutPrintableDirectoryContext(
      new URLSearchParams(searchParams?.toString()),
    ).toString();

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : (pathname ?? '/'), {
      scroll: false,
    });
  }, [router, pathname, searchParams]);

  return { context, isLoading, dismiss };
}
