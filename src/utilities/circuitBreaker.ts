/**
 * A per-process circuit breaker for an optional dependency (Redis, Arcjet):
 * after `failureThreshold` failures in a row the dependency is skipped for
 * `openMs`, then a single call goes through as a probe. A successful probe
 * closes the circuit; a failed one opens it for another `openMs`.
 *
 * It only decides whether to call. The caller reports each outcome and logs
 * the transitions that `recordFailure` / `recordSuccess` return, so the
 * module needs no logger and can be unit-tested with a fake clock.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  openMs: number;
  /** Test seam. */
  now?: () => number;
}

export interface CircuitBreaker {
  readonly state: CircuitState;
  /** Whether to call the dependency now. False counts as one skipped call. */
  allow(): boolean;
  /** `opened` when this failure opened the circuit, `reopened` when a probe failed. */
  recordFailure(): 'opened' | 'reopened' | null;
  /** Non-null when this success closed the circuit. */
  recordSuccess(): { skipped: number; openForMs: number } | null;
}

export function createCircuitBreaker({
  failureThreshold,
  openMs,
  now = Date.now,
}: CircuitBreakerOptions): CircuitBreaker {
  let state: CircuitState = 'closed';
  let consecutiveFailures = 0;
  let openedAt = 0;
  let openUntil = 0;
  let probeStartedAt = 0;
  let skipped = 0;

  function open() {
    state = 'open';
    openUntil = now() + openMs;
  }

  return {
    get state() {
      return state;
    },

    allow() {
      if (state === 'closed') return true;
      const t = now();
      if (state === 'open' && t >= openUntil) {
        state = 'half-open';
        probeStartedAt = t;
        return true;
      }
      // A probe whose outcome was never reported (it hung, or the caller
      // could not classify it) must not hold the circuit forever.
      if (state === 'half-open' && t - probeStartedAt >= openMs) {
        probeStartedAt = t;
        return true;
      }
      skipped += 1;
      return false;
    },

    recordFailure() {
      // Late results of calls that started before the circuit opened.
      if (state === 'open') return null;
      if (state === 'half-open') {
        open();
        return 'reopened';
      }
      consecutiveFailures += 1;
      if (consecutiveFailures < failureThreshold) return null;
      openedAt = now();
      open();
      return 'opened';
    },

    recordSuccess() {
      consecutiveFailures = 0;
      // A late success from before the circuit opened is not a probe.
      if (state !== 'half-open') return null;
      state = 'closed';
      const closed = { skipped, openForMs: now() - openedAt };
      skipped = 0;
      return closed;
    },
  };
}
