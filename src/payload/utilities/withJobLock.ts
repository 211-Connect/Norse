import type { PostgresAdapter } from '@payloadcms/db-postgres';
import type { Payload } from 'payload';

import { createLogger } from '@/lib/logger';

const log = createLogger('jobLock');

// Arbitrary classid for pg advisory locks (2-int form), namespacing our locks
// away from any other advisory lock usage sharing this Postgres cluster.
const JOB_LOCK_CLASSID = 918_273_645;

export type JobLockResult<T> =
  { acquired: true; result: T } | { acquired: false };

/**
 * Runs `fn` only if a Postgres advisory lock for `lockKey` can be acquired,
 * making job execution safe even when multiple replicas poll the same queue
 * (autoRun runs in every Payload process; job claiming itself is not atomic —
 * see node_modules/@payloadcms/drizzle/dist/updateJobs.js).
 */
export async function withJobLock<T>(
  payload: Payload,
  lockKey: string,
  fn: () => Promise<T>,
): Promise<JobLockResult<T>> {
  const pool = (payload.db as unknown as PostgresAdapter).pool;
  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      'SELECT pg_try_advisory_lock($1, hashtext($2)) AS locked',
      [JOB_LOCK_CLASSID, lockKey],
    );

    if (!rows[0]?.locked) {
      return { acquired: false };
    }

    try {
      const result = await fn();
      return { acquired: true, result };
    } finally {
      try {
        await client.query('SELECT pg_advisory_unlock($1, hashtext($2))', [
          JOB_LOCK_CLASSID,
          lockKey,
        ]);
      } catch (error) {
        log.error({ err: error, lockKey }, 'Failed to release job lock');
      }
    }
  } finally {
    client.release();
  }
}
