/**
 * Which Arcjet decisions get an `arcjet_decision` record, and burst mode.
 * Per process (instance); exact counts always come from metrics. See
 * docs/observability.md ("arcjet_decision sampling").
 *
 * | Case                              | Logged                                      |
 * |-----------------------------------|---------------------------------------------|
 * | route=print                       | every call                                  |
 * | ALLOW / CHALLENGE                 | trace sampled, or host in burst mode        |
 * | DENY / DENIED_NOT_ENFORCED        | N/min per (reason_type, denied_bots) key    |
 * | ERROR / THREW / NO_CLIENT_IP      | 20/min                                      |
 * | a dry-run rule matched            | 20/min per (route, rule)                    |
 * | overall                           | hard cap, ARCJET_LOG_MAX_PER_MIN            |
 */

function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export interface DecisionSamplingConfig {
  denyPerMinute: number;
  maxPerMinute: number;
  errorPerMinute: number;
  dryRunPerMinute: number;
  burstMinPerInstance: number;
  burstLogPerMinute: number;
  /** Multiple of the host's baseline a minute must exceed. */
  burstFactor: number;
  burstDurationMs: number;
}

export function samplingConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): DecisionSamplingConfig {
  return {
    denyPerMinute: positiveInt(env.ARCJET_LOG_DENY_PER_MIN, 5),
    maxPerMinute: positiveInt(env.ARCJET_LOG_MAX_PER_MIN, 600),
    errorPerMinute: 20,
    dryRunPerMinute: 20,
    burstMinPerInstance: positiveInt(env.ARCJET_BURST_MIN_PER_INSTANCE, 40),
    burstLogPerMinute: positiveInt(env.ARCJET_BURST_LOG_PER_MIN, 300),
    burstFactor: 5,
    burstDurationMs: 5 * 60_000,
  };
}

const MAX_KEYS = 500;

/** At most `max` per wall-clock minute per key; counts what it drops. */
export class KeyedMinuteCap {
  private readonly state = new Map<
    string,
    { minute: number; count: number; droppedSinceLast: number }
  >();

  constructor(
    private readonly max: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Undefined when dropped, else the number dropped since the last pass. */
  take(key = ''): number | undefined {
    const minute = Math.floor(this.now() / 60_000);
    let entry = this.state.get(key);
    if (!entry) {
      if (this.state.size >= MAX_KEYS) {
        const oldest = this.state.keys().next().value;
        if (oldest !== undefined) this.state.delete(oldest);
      }
      entry = { minute, count: 0, droppedSinceLast: 0 };
      this.state.set(key, entry);
    }
    if (entry.minute !== minute) {
      entry.minute = minute;
      entry.count = 0;
    }
    if (entry.count >= this.max) {
      entry.droppedSinceLast += 1;
      return undefined;
    }
    entry.count += 1;
    const dropped = entry.droppedSinceLast;
    entry.droppedSinceLast = 0;
    return dropped;
  }
}

interface HostBurstState {
  /** 6 buckets of 10 s: the last 60 seconds. */
  buckets: number[];
  bucketAt: number;
  /** Count in the current wall-clock minute (baseline input). */
  minuteCount: number;
  minute: number;
  /** Slow moving average of protect calls per minute; undefined at start. */
  baseline?: number;
  burstUntil: number;
}

const BUCKET_MS = 10_000;
const BUCKETS = 6;
/** EWMA weight of one minute: about a 30-minute memory. */
const BASELINE_ALPHA = 1 / 30;

/**
 * Burst mode per host: protect calls in the last 60 s above
 * `burstMinPerInstance` AND above `burstFactor` × the host's baseline. Lasts
 * `burstDurationMs` after the last minute that met it. The baseline does not
 * move while a burst is on, so a long flood stays a burst.
 */
export class BurstDetector {
  private readonly hosts = new Map<string, HostBurstState>();

  constructor(
    private readonly config: Pick<
      DecisionSamplingConfig,
      'burstMinPerInstance' | 'burstFactor' | 'burstDurationMs'
    >,
    private readonly now: () => number = Date.now,
  ) {}

  private stateOf(host: string, t: number): HostBurstState {
    let s = this.hosts.get(host);
    if (!s) {
      if (this.hosts.size >= MAX_KEYS) {
        const oldest = this.hosts.keys().next().value;
        if (oldest !== undefined) this.hosts.delete(oldest);
      }
      s = {
        buckets: new Array(BUCKETS).fill(0),
        bucketAt: Math.floor(t / BUCKET_MS),
        minuteCount: 0,
        minute: Math.floor(t / 60_000),
        burstUntil: 0,
      };
      this.hosts.set(host, s);
    }
    return s;
  }

  private advance(s: HostBurstState, t: number): void {
    const bucket = Math.floor(t / BUCKET_MS);
    const steps = Math.min(bucket - s.bucketAt, BUCKETS);
    for (let i = 1; i <= steps; i++) {
      s.buckets[(s.bucketAt + i) % BUCKETS] = 0;
    }
    if (bucket > s.bucketAt) s.bucketAt = bucket;

    const minute = Math.floor(t / 60_000);
    if (minute !== s.minute) {
      const inBurst = t < s.burstUntil;
      if (!inBurst) {
        // Minutes with no calls at all also count as zero.
        const idle = Math.max(0, minute - s.minute - 1);
        let base = s.baseline ?? s.minuteCount;
        base = base + BASELINE_ALPHA * (s.minuteCount - base);
        for (let i = 0; i < Math.min(idle, 120); i++) {
          base = base * (1 - BASELINE_ALPHA);
        }
        s.baseline = base;
      }
      s.minute = minute;
      s.minuteCount = 0;
    }
  }

  /** Records one protect call for `host`; true while the host is in burst. */
  record(host: string): boolean {
    const t = this.now();
    const s = this.stateOf(host, t);
    this.advance(s, t);
    s.buckets[s.bucketAt % BUCKETS] += 1;
    s.minuteCount += 1;

    const last60 = s.buckets.reduce((a, b) => a + b, 0);
    const baseline = s.baseline ?? 0;
    if (
      last60 > this.config.burstMinPerInstance &&
      last60 > this.config.burstFactor * baseline
    ) {
      s.burstUntil = t + this.config.burstDurationMs;
    }
    return t < s.burstUntil;
  }

  isBurst(host: string): boolean {
    const s = this.hosts.get(host);
    return s !== undefined && this.now() < s.burstUntil;
  }

  /** Hosts currently in burst mode (for the `burst_active` gauge). */
  activeHosts(): string[] {
    const t = this.now();
    return [...this.hosts.entries()]
      .filter(([, s]) => t < s.burstUntil)
      .map(([host]) => host);
  }

  /** Every host seen, with its state (gauge reports 0 after a burst). */
  knownHosts(): { host: string; active: boolean }[] {
    const t = this.now();
    return [...this.hosts.entries()].map(([host, s]) => ({
      host,
      active: t < s.burstUntil,
    }));
  }
}

export interface SamplingInput {
  conclusion: string;
  route: string;
  host: string;
  /** Whether the request's trace is sampled (stored in Tempo). */
  traceSampled: boolean;
  /** Burst state from `BurstDetector.record` for this call. */
  burst: boolean;
  reasonType?: string;
  deniedBots?: string[];
  /** `route:ruleType:ruleId` of each DRY_RUN rule that matched. */
  dryRunKeys?: string[];
}

export interface SamplingResult {
  log: boolean;
  /** Records dropped under this record's cap since the last one logged. */
  sampledOutSinceLast?: number;
}

/** The logging policy for `arcjet_decision`, one per process. */
export class DecisionSampler {
  private readonly hardCap: KeyedMinuteCap;
  private readonly denyCap: KeyedMinuteCap;
  private readonly errorCap: KeyedMinuteCap;
  private readonly dryRunCap: KeyedMinuteCap;
  private readonly burstCap: KeyedMinuteCap;

  constructor(config: DecisionSamplingConfig, now: () => number = Date.now) {
    this.hardCap = new KeyedMinuteCap(config.maxPerMinute, now);
    this.denyCap = new KeyedMinuteCap(config.denyPerMinute, now);
    this.errorCap = new KeyedMinuteCap(config.errorPerMinute, now);
    this.dryRunCap = new KeyedMinuteCap(config.dryRunPerMinute, now);
    this.burstCap = new KeyedMinuteCap(config.burstLogPerMinute, now);
  }

  decide(input: SamplingInput): SamplingResult {
    const policy = this.policy(input);
    if (!policy.log) return policy;
    // The hard cap is checked last so a capped case does not use it up.
    return this.hardCap.take() === undefined ? { log: false } : policy;
  }

  private policy(input: SamplingInput): SamplingResult {
    const { conclusion } = input;
    if (conclusion === 'SKIPPED') return { log: false };
    if (input.route === 'print') return { log: true };

    if (conclusion === 'DENY' || conclusion === 'DENIED_NOT_ENFORCED') {
      const key = `${input.reasonType ?? ''}|${[...(input.deniedBots ?? [])].sort().join(',')}`;
      const dropped = this.denyCap.take(key);
      return dropped === undefined
        ? { log: false }
        : { log: true, sampledOutSinceLast: dropped };
    }

    if (
      conclusion === 'ERROR' ||
      conclusion === 'THREW' ||
      conclusion === 'NO_CLIENT_IP'
    ) {
      const dropped = this.errorCap.take(conclusion);
      return dropped === undefined
        ? { log: false }
        : { log: true, sampledOutSinceLast: dropped };
    }

    // ALLOW / CHALLENGE
    if (input.traceSampled) return { log: true };
    if (input.burst) {
      const dropped = this.burstCap.take(input.host);
      if (dropped !== undefined) {
        return { log: true, sampledOutSinceLast: dropped };
      }
    }
    for (const key of input.dryRunKeys ?? []) {
      if (this.dryRunCap.take(key) !== undefined) return { log: true };
    }
    return { log: false };
  }
}
