import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ACTIVE_RESOURCE_TYPE_LIMIT,
  countActiveResources,
} from '../src/lib/telemetry/active-resources';

describe('countActiveResources', () => {
  it('counts by type, most common first', () => {
    assert.deepEqual(
      countActiveResources([
        'TCPSocketWrap',
        'Timeout',
        'Timeout',
        'TTYWrap',
        'Timeout',
        'TTYWrap',
      ]),
      [
        { type: 'Timeout', count: 3 },
        { type: 'TTYWrap', count: 2 },
        { type: 'TCPSocketWrap', count: 1 },
      ],
    );
  });

  it('keeps the top ten types and sums the rest into other', () => {
    const resources: string[] = [];
    // 12 distinct types: type-0 appears most often, type-11 least.
    for (let index = 0; index < 12; index += 1) {
      for (let count = 12 - index; count > 0; count -= 1) {
        resources.push(`type-${index}`);
      }
    }

    const counts = countActiveResources(resources);

    assert.equal(counts.length, ACTIVE_RESOURCE_TYPE_LIMIT + 1);
    assert.deepEqual(counts[0], { type: 'type-0', count: 12 });
    assert.deepEqual(counts[9], { type: 'type-9', count: 3 });
    assert.deepEqual(counts[10], { type: 'other', count: 3 });
    // Every active resource is accounted for exactly once.
    assert.equal(
      counts.reduce((sum, entry) => sum + entry.count, 0),
      resources.length,
    );
  });

  it('merges a real `other` type into the overflow bucket', () => {
    const counts = countActiveResources(
      ['other', 'other', 'other', 'type-0', 'type-0', 'type-1', 'type-2'],
      2,
    );

    assert.deepEqual(counts, [
      { type: 'other', count: 5 },
      { type: 'type-0', count: 2 },
    ]);
  });

  it('returns nothing for no active resources', () => {
    assert.deepEqual(countActiveResources([]), []);
  });
});
