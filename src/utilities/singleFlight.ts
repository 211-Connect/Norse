/**
 * Shares one in-flight call per key within this process: concurrent callers
 * with the same key await the same promise instead of each running `fn`.
 * The entry is removed when the call settles, so a rejection is shared only
 * by the callers already waiting, never by later ones.
 *
 * An entry older than `maxAgeMs` is not joined: a hung call must not block
 * every later caller of that key for the life of the process.
 */
export function createSingleFlight<K>(maxAgeMs: number) {
  const inFlight = new Map<
    K,
    { promise: Promise<unknown>; startedAt: number }
  >();

  function run<T>(
    key: K,
    fn: () => Promise<T>,
  ): { promise: Promise<T>; shared: boolean } {
    const existing = inFlight.get(key);
    if (existing && Date.now() - existing.startedAt < maxAgeMs) {
      return { promise: existing.promise as Promise<T>, shared: true };
    }

    const promise: Promise<T> = (async () => fn())().finally(() => {
      // A stale entry may have been replaced; only remove our own.
      if (inFlight.get(key)?.promise === promise) inFlight.delete(key);
    });
    inFlight.set(key, { promise, startedAt: Date.now() });
    return { promise, shared: false };
  }

  return Object.assign(run, { size: () => inFlight.size });
}
