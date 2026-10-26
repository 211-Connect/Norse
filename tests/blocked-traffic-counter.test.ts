import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { BlockedTrafficBucketDto } from '../src/lib/api/generated/data-contracts';
import type { ArcjetLog } from '../src/lib/arcjet';
import {
  BLOCKED_TRAFFIC_MAX_RETAINED_MS,
  createBlockedTrafficCounter,
} from '../src/lib/blocked-traffic-counter';

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const HOUR = Date.parse('2026-10-22T14:00:00.000Z');

function setup(options: { fail?: (tenantId: string) => boolean } = {}) {
  let clock = HOUR + 25 * 60_000;
  const pushes: { tenantId: string; buckets: BlockedTrafficBucketDto[] }[] = [];
  const logs: { event: string; data: Record<string, unknown> }[] = [];
  let scheduledFlush: (() => void) | undefined;
  let scheduleCalls = 0;
  const log: ArcjetLog = (_level, event, data) => logs.push({ event, data });

  const counter = createBlockedTrafficCounter({
    log,
    now: () => clock,
    schedule: (flush) => {
      scheduleCalls += 1;
      scheduledFlush = flush;
    },
    push: async (tenantId, buckets) => {
      if (options.fail?.(tenantId)) throw new Error('Norse-API down');
      pushes.push({ tenantId, buckets });
    },
  });

  return {
    counter,
    pushes,
    logs,
    setClock: (ms: number) => {
      clock = ms;
    },
    scheduled: () => ({ calls: scheduleCalls, flush: scheduledFlush }),
  };
}

const sortBuckets = (buckets: BlockedTrafficBucketDto[]) =>
  [...buckets].sort((a, b) =>
    `${a.hour}${a.classification}${a.enforced}`.localeCompare(
      `${b.hour}${b.classification}${b.enforced}`,
    ),
  );

describe('blocked traffic counter (ISS-2366)', () => {
  test('aggregates denials per tenant, hour, classification and enforcement', async () => {
    const { counter, pushes } = setup();
    counter.record(TENANT_A, 'nefarious', true);
    counter.record(TENANT_A, 'nefarious', true);
    counter.record(TENANT_A, 'seo', true);
    counter.record(TENANT_A, 'nefarious', false);
    counter.record(TENANT_B, 'unknown', true);
    assert.equal(counter.pendingCount(), 5);

    await counter.flush();

    assert.equal(counter.pendingCount(), 0);
    assert.equal(pushes.length, 2);
    const a = pushes.find((p) => p.tenantId === TENANT_A);
    assert.deepEqual(sortBuckets(a?.buckets ?? []), [
      {
        hour: '2026-10-22T14:00:00.000Z',
        classification: 'nefarious',
        enforced: false,
        count: 1,
      },
      {
        hour: '2026-10-22T14:00:00.000Z',
        classification: 'nefarious',
        enforced: true,
        count: 2,
      },
      {
        hour: '2026-10-22T14:00:00.000Z',
        classification: 'seo',
        enforced: true,
        count: 1,
      },
    ]);
    assert.deepEqual(pushes.find((p) => p.tenantId === TENANT_B)?.buckets, [
      {
        hour: '2026-10-22T14:00:00.000Z',
        classification: 'unknown',
        enforced: true,
        count: 1,
      },
    ]);
  });

  test('splits a flush window that crosses the hour into two buckets', async () => {
    const { counter, pushes, setClock } = setup();
    setClock(HOUR + 59 * 60_000);
    counter.record(TENANT_A, 'seo', true);
    setClock(HOUR + 61 * 60_000);
    counter.record(TENANT_A, 'seo', true);

    await counter.flush();

    assert.deepEqual(
      pushes[0].buckets.map((b) => [b.hour, b.count]),
      [
        ['2026-10-22T14:00:00.000Z', 1],
        ['2026-10-22T15:00:00.000Z', 1],
      ],
    );
  });

  test('an empty flush pushes nothing', async () => {
    const { counter, pushes } = setup();
    await counter.flush();
    assert.equal(pushes.length, 0);
  });

  test('a failed push is added back and sent with the next flush; other tenants are unaffected', async () => {
    let down = true;
    const { counter, pushes, logs } = setup({
      fail: (tenantId) => down && tenantId === TENANT_A,
    });
    counter.record(TENANT_A, 'nefarious', true);
    counter.record(TENANT_B, 'seo', true);

    await counter.flush();

    assert.deepEqual(
      pushes.map((p) => p.tenantId),
      [TENANT_B],
    );
    assert.equal(counter.pendingCount(), 1);
    const failed = logs.find((l) => l.event === 'blocked_traffic_push_failed');
    assert.equal(failed?.data.tenantId, TENANT_A);
    assert.equal(failed?.data.requeued, 1);

    counter.record(TENANT_A, 'nefarious', true);
    down = false;
    await counter.flush();

    const retried = pushes.find((p) => p.tenantId === TENANT_A);
    assert.equal(retried?.buckets.length, 1);
    assert.equal(retried?.buckets[0].count, 2);
    assert.equal(counter.pendingCount(), 0);
  });

  test('a failed push drops buckets older than the retention window', async () => {
    const { counter, logs, setClock } = setup({ fail: () => true });
    counter.record(TENANT_A, 'unknown', true);
    setClock(HOUR + BLOCKED_TRAFFIC_MAX_RETAINED_MS + 2 * 60 * 60_000);
    counter.record(TENANT_A, 'unknown', true);

    await counter.flush();

    assert.equal(counter.pendingCount(), 1);
    const failed = logs.find((l) => l.event === 'blocked_traffic_push_failed');
    assert.equal(failed?.data.requeued, 1);
    assert.equal(failed?.data.dropped, 1);
  });

  test('denials recorded during an in-flight flush go to the next one', async () => {
    let release: () => void = () => {};
    const pushes: number[] = [];
    const counter = createBlockedTrafficCounter({
      log: () => {},
      now: () => HOUR,
      schedule: () => {},
      push: async (_tenantId, buckets) => {
        pushes.push(buckets.reduce((sum, b) => sum + b.count, 0));
        if (pushes.length === 1) {
          await new Promise<void>((resolve) => {
            release = resolve;
          });
        }
      },
    });

    counter.record(TENANT_A, 'seo', true);
    const first = counter.flush();
    counter.record(TENANT_A, 'seo', true);
    assert.equal(counter.flush(), first, 'concurrent flushes share one');
    release();
    await first;

    assert.equal(counter.pendingCount(), 1);
    await counter.flush();
    assert.deepEqual(pushes, [1, 1]);
  });

  test('schedules the periodic flush once, on the first denial', async () => {
    const { counter, pushes, scheduled } = setup();
    assert.equal(scheduled().calls, 0);
    counter.record(TENANT_A, 'seo', true);
    counter.record(TENANT_A, 'seo', true);
    assert.equal(scheduled().calls, 1);

    scheduled().flush?.();
    await counter.flush();
    assert.equal(pushes.length, 1);
    assert.equal(pushes[0].buckets[0].count, 2);
  });
});
