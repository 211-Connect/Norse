'use client';

import { useEffect, useState } from 'react';

import { PD_SLUG_PARAM } from '@/app/(app)/shared/components/directory-print/share-link-params';
import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';

/**
 * The fixed, non-editable part of a directory's public share URL (everything
 * before the slug). Resolved after mount: the origin isn't known during
 * server rendering, and reading it during render causes a hydration
 * mismatch.
 */
export function useShareUrlBase(): string {
  const [base, setBase] = useState(`/?${PD_SLUG_PARAM}=`);

  useEffect(() => {
    setBase(
      withOptionalCustomBasePath(
        `${window.location.origin}/?${PD_SLUG_PARAM}=`,
      ),
    );
  }, []);

  return base;
}
