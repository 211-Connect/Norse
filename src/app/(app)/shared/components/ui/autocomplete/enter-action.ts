/**
 * What Enter (or Tab) does in the suggestion list. While the options are still loading and the
 * caller asked to wait, the key does not commit: it commits once the options arrive.
 */
export function enterAction({
  waitForOptions,
  loading,
}: {
  waitForOptions: boolean;
  loading: boolean;
}): 'commit' | 'wait' {
  return waitForOptions && loading ? 'wait' : 'commit';
}
