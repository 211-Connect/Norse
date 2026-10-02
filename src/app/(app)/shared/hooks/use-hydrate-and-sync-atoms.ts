'use client';

import { useAtomCallback, useHydrateAtoms } from 'jotai/react/utils';
import { useCallback, useLayoutEffect } from 'react';

/**
 * `useHydrateAtoms` only writes an atom the first time a store sees it, and the
 * Jotai store outlives client navigations, so later pages need the sync below.
 * It runs in a layout effect so the corrected values re-render before paint;
 * a regular effect let the previous page's values show for a frame.
 *
 * Request data that is never edited on the client (e.g. search results) should
 * go through React context instead — see `SearchResultsProvider`.
 *
 * @url https://github.com/pmndrs/jotai/discussions/669#discussioncomment-1244421
 */
export function useHydrateAndSyncAtoms(values) {
  useHydrateAtoms(values);

  const sync = useAtomCallback(
    useCallback(
      (_get, set) => {
        for (const [a, v] of values) {
          set(a, v);
        }
      },
      [values],
    ),
  );

  useLayoutEffect(() => {
    sync();
  }, [sync]);
}
