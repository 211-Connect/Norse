'use client';

import { useAtomCallback, useHydrateAtoms } from 'jotai/react/utils';
import { useCallback, useEffect } from 'react';

/**
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

  useEffect(() => {
    sync();
  }, [sync]);
}
