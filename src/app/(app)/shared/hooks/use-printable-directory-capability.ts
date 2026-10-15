'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

import {
  PrintableDirectoryCapability,
  PrintableDirectoryViewerAccess,
} from '@/types/appConfig';

import { getPrintableDirectoryViewerAccess } from '../utils/canAccessPrintableDirectories';
import { useAppConfig } from './use-app-config';

/**
 * The current user's printable directory access. For gating UI only; every
 * server action re-checks access itself.
 */
export function usePrintableDirectoryAccess(): PrintableDirectoryViewerAccess {
  const session = useSession();
  const appConfig = useAppConfig();
  const userEmail = session.data?.user?.email;

  return useMemo(
    () => getPrintableDirectoryViewerAccess(userEmail, appConfig),
    [userEmail, appConfig],
  );
}

export function usePrintableDirectoryCapability(
  capability: PrintableDirectoryCapability,
): boolean {
  return usePrintableDirectoryAccess().capabilities.includes(capability);
}
