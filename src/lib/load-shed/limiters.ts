/**
 * The two per-tenant limits (docs/load-shedding.md). Pure: the clock and
 * Redis are injected, so both are unit-tested without a server.
 */

export interface ConcurrencyLimiter {
  /**
   * Take a slot for `key`. Returns the release function (idempotent), or
   * null when `key` already has `max` requests in flight.
   */
  tryAcquire(key: string): (() => void) | null;
  /** Requests in flight per key (metrics, tests). */
  inFlight(): ReadonlyMap<string, number>;
}

/** Per-key in-flight counter for one server instance. */
export function createConcurrencyLimiter(max: number): ConcurrencyLimiter {
  const counts = new Map<string, number>();

  return {
    tryAcquire(key) {
      if (max <= 0) return () => {};
      const current = counts.get(key) ?? 0;
      if (current >= max) return null;
      counts.set(key, current + 1);

      let released = false;
      return () => {
        if (released) return;
        released = true;
        const remaining = (counts.get(key) ?? 1) - 1;
        if (remaining <= 0) counts.delete(key);
        else counts.set(key, remaining);
      };
    },
    inFlight: () => counts,
  };
}

/** `INCR` + `EXPIRE` in one round trip; null when Redis did not answer. */
export type WindowIncrement = (
  key: string,
  ttlSeconds: number,
) => Promise<number | null>;

export interface MinuteLimiterOptions {
  max: number;
  increment: WindowIncrement;
  /** A slower Redis answer counts as none: the request is allowed. */
  timeoutMs: number;
  now?: () => number;
}

/** Keys outlive their minute a little, so a late INCR never resets a count. */
export const MINUTE_WINDOW_TTL_SECONDS = 70;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  return Promise.race([promise.catch(() => null), timeout]).finally(() =>
    clearTimeout(timer),
  );
}

/**
 * Requests per key per calendar minute, counted in Redis across every
 * instance (a fixed window: `loadshed:<key>:<epochMinute>`). Fails open:
 * no Redis, an error or an answer slower than `timeoutMs` allows the
 * request. Once a key is over the limit, this instance remembers it until
 * the minute ends and stops asking Redis.
 */
export function createMinuteLimiter({
  max,
  increment,
  timeoutMs,
  now = Date.now,
}: MinuteLimiterOptions) {
  const overInMinute = new Map<string, number>();

  return async function allow(key: string): Promise<boolean> {
    if (max <= 0) return true;
    const minute = Math.floor(now() / 60_000);
    if (overInMinute.get(key) === minute) return false;

    const count = await withTimeout(
      increment(`loadshed:${key}:${minute}`, MINUTE_WINDOW_TTL_SECONDS),
      timeoutMs,
    );
    if (count === null || count <= max) return true;

    for (const [staleKey, staleMinute] of overInMinute) {
      if (staleMinute !== minute) overInMinute.delete(staleKey);
    }
    overInMinute.set(key, minute);
    return false;
  };
}
