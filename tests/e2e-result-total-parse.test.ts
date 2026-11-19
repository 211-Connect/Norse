import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  parseTotalFromResultText,
  parseTrailingInteger,
} from '../e2e/helpers/url';

/**
 * The e2e helpers read `#result-total` (`ResultTotal`) to compare totals.
 * A tenant with "Show all results on the map" renders a capped total as
 * `10,000+`; reading that as 0 made every WA dev search look empty.
 */
describe('e2e result total parsing', () => {
  it('reads a plain total', () => {
    assert.equal(parseTrailingInteger('1-25 of 652'), 652);
    assert.equal(parseTrailingInteger('1-25 of 10,000'), 10_000);
  });

  it('reads a capped total with a trailing +', () => {
    assert.equal(parseTrailingInteger('1-25 of 10,000+'), 10_000);
    assert.equal(parseTrailingInteger('1-25 of 10,000+ '), 10_000);
  });

  it('reads locale thousands separators', () => {
    assert.equal(parseTrailingInteger('1-25 de 10.000+'), 10_000);
    assert.equal(parseTrailingInteger('1-25 de 1 234'), 1234);
    assert.equal(parseTrailingInteger('1-25 de 1 234'), 1234);
  });

  it('reads a filter row count', () => {
    assert.equal(parseTrailingInteger('General 652'), 652);
  });

  it('returns 0 without a trailing number', () => {
    assert.equal(parseTrailingInteger(''), 0);
    assert.equal(parseTrailingInteger('No results'), 0);
  });

  it('parseTotalFromResultText reads the total, capped or not', () => {
    assert.equal(parseTotalFromResultText('0-0 of 0'), 0);
    // The old `/of\s+(\d+)/` read this as 10.
    assert.equal(parseTotalFromResultText('1-25 of 10,000+'), 10_000);
    assert.equal(parseTotalFromResultText('1-25 de 2.707'), 2707);
  });
});
