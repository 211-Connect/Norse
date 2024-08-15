import { useAtomCallback, useHydrateAtoms } from 'jotai/react/utils';
import { useCallback, useEffect, useRef } from 'react';

/**
 *
 * @url https://github.com/pmndrs/jotai/discussions/669#discussioncomment-1244421
 */
export function useHydrateAndSyncAtoms(values) {
  const isInitial = useRef(true);

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
    if (isInitial.current) {
      isInitial.current = false;
    } else {
      sync();
    }
  }, [sync]);
}
