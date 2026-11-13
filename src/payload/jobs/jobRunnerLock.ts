import type { PostgresAdapter } from '@payloadcms/db-postgres';
import type { Payload } from 'payload';
import type { Client } from 'pg';

import { createLogger } from '@/lib/logger';

const log = createLogger('jobRunnerLock');

/**
 * Postgres advisory lock key that elects the one instance allowed to schedule
 * and run Payload jobs. Any constant works as long as nothing else uses it.
 */
const JOB_RUNNER_LOCK_KEY = 211_001;

/**
 * Payload calls `shouldAutoRun` once per `autoRun` entry on the same minute
 * tick; calls within this window share one lock check and one scheduling pass.
 */
const TICK_WINDOW_MS = 5_000;

let client: Client | null = null;
let isLeader = false;
let tick: { startedAt: number; result: Promise<boolean> } | null = null;

function dropConnection(reason: string, err?: unknown) {
  if (isLeader) {
    log.warn({ err, reason }, 'Lost the job runner lock');
  }
  const stale = client;
  client = null;
  isLeader = false;
  stale?.end().catch(() => {});
}

async function connect(payload: Payload): Promise<Client> {
  const db = payload.db as unknown as PostgresAdapter;
  const next = new db.pg.Client({
    ...db.poolOptions,
    application_name: `${db.poolOptions.application_name ?? 'norse'}-jobs-lock`,
  });
  next.on('error', (err) => {
    if (client === next) dropConnection('connection error', err);
  });
  next.on('end', () => {
    if (client === next) dropConnection('connection ended');
  });
  await next.connect();
  return next;
}

async function checkLock(payload: Payload): Promise<boolean> {
  try {
    if (!client) client = await connect(payload);

    if (isLeader) {
      // The lock lives as long as this session; just make sure it still does.
      await client.query('select 1');
      return true;
    }

    const { rows } = await client.query<{ locked: boolean }>(
      'select pg_try_advisory_lock($1) as locked',
      [JOB_RUNNER_LOCK_KEY],
    );
    isLeader = rows[0]?.locked === true;
    if (isLeader) log.info('Acquired the job runner lock');
    return isLeader;
  } catch (err) {
    dropConnection('lock check failed', err);
    log.error({ err }, 'Job runner lock check failed');
    return false;
  }
}

async function runTick(payload: Payload): Promise<boolean> {
  if (!(await checkLock(payload))) return false;

  // Scheduling is disabled on every `autoRun` entry so that only the lock
  // holder queues scheduled jobs; Payload's own check-then-insert would queue
  // the same scheduled job once per instance.
  try {
    await payload.jobs.handleSchedules({ allQueues: true });
  } catch (err) {
    log.error({ err }, 'Scheduling jobs failed');
  }
  return true;
}

/**
 * True on exactly one instance at a time: the one holding a session-level
 * Postgres advisory lock on a dedicated connection. With several CMS
 * instances, Payload's job claim (select, then update) lets two instances
 * pick up and run the same job, and one then deletes it while the other is
 * still writing to it (docs/payload-jobs.md). If the holder dies, its
 * connection closes, Postgres releases the lock and another instance takes
 * over on its next tick.
 */
export function holdsJobRunnerLock(payload: Payload): Promise<boolean> {
  const now = Date.now();
  if (!tick || now - tick.startedAt > TICK_WINDOW_MS) {
    tick = { startedAt: now, result: runTick(payload) };
  }
  return tick.result;
}
