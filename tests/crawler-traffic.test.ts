import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { crawlerTrafficOf } from '../src/lib/crawler-traffic';

describe('crawlerTrafficOf', () => {
  test('a bot denial on an enforced host is blocked, under the first denied crawler', () => {
    assert.deepEqual(
      crawlerTrafficOf({
        denied: true,
        conclusion: 'DENY',
        deniedBots: ['AHREFS_CRAWLER', 'CURL'],
        reasonType: 'BOT',
      }),
      {
        crawler: 'AHREFS_CRAWLER',
        outcome: 'blocked',
        classification: 'nefarious',
      },
    );
  });

  test('a rate-limit denial is rate_limited, with no crawler', () => {
    assert.deepEqual(
      crawlerTrafficOf({
        denied: true,
        conclusion: 'DENY',
        deniedBots: [],
        reasonType: 'RATE_LIMIT',
      }),
      { crawler: '', outcome: 'rate_limited', classification: 'unknown' },
    );
  });

  test('a denial on an observe-only host is logged', () => {
    assert.deepEqual(
      crawlerTrafficOf({
        denied: false,
        conclusion: 'DENIED_NOT_ENFORCED',
        deniedBots: ['SEMRUSH_CRAWLER'],
        reasonType: 'BOT',
      }),
      { crawler: 'SEMRUSH_CRAWLER', outcome: 'logged', classification: 'seo' },
    );
  });

  test('an allowed crawler is allowed; a plain allow is not counted', () => {
    assert.deepEqual(
      crawlerTrafficOf({
        denied: false,
        conclusion: 'ALLOW',
        allowedBots: ['GOOGLE_CRAWLER'],
      }),
      {
        crawler: 'GOOGLE_CRAWLER',
        outcome: 'allowed',
        classification: 'unknown',
      },
    );
    assert.equal(
      crawlerTrafficOf({ denied: false, conclusion: 'ALLOW' }),
      null,
    );
    assert.equal(
      crawlerTrafficOf({ denied: false, conclusion: 'ERROR' }),
      null,
    );
  });
});
