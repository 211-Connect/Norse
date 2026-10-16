import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  ARCJET_CATEGORIES,
  NEFARIOUS_CATEGORIES,
  SEO_CATEGORIES,
  SEO_VENDOR_BOTS,
  classifyBlockedTraffic,
  classifyBot,
} from '../src/lib/arcjet-classification';

/** Guard against the SDK renaming a category the rules depend on. */
describe('category map (real @arcjet/protocol data)', () => {
  test('every category the rules name exists in the SDK map', () => {
    for (const category of [...SEO_CATEGORIES, ...NEFARIOUS_CATEGORIES]) {
      assert.ok(
        category in ARCJET_CATEGORIES,
        `${category} missing from @arcjet/protocol categories`,
      );
    }
  });

  test('every named SEO vendor is a well-known bot in the SDK map', () => {
    const known = new Set<string>(Object.values(ARCJET_CATEGORIES).flat());
    for (const bot of SEO_VENDOR_BOTS) {
      assert.ok(known.has(bot), `${bot} is not a known Arcjet bot`);
    }
  });
});

describe('classifyBot (ISS-2366)', () => {
  test('seo: a member of CATEGORY:OPTIMIZER', () => {
    const [bot] = ARCJET_CATEGORIES['CATEGORY:OPTIMIZER'];
    assert.deepEqual(classifyBot(bot), {
      classification: 'seo',
      category: 'CATEGORY:OPTIMIZER',
    });
  });

  test('seo: a named vendor that the SDK files under CATEGORY:UNKNOWN', () => {
    assert.ok(
      ARCJET_CATEGORIES['CATEGORY:UNKNOWN'].includes('SEMRUSH_CRAWLER'),
    );
    assert.deepEqual(classifyBot('SEMRUSH_CRAWLER'), {
      classification: 'seo',
      category: 'CATEGORY:UNKNOWN',
    });
    assert.equal(classifyBot('MOZ_CRAWLER').classification, 'seo');
    assert.equal(classifyBot('DATAFORSEO_CRAWLER').classification, 'seo');
    assert.equal(classifyBot('BRIGHTEDGE_CRAWLER').classification, 'seo');
  });

  test('nefarious: CATEGORY:TOOL and CATEGORY:PROGRAMMATIC members', () => {
    assert.deepEqual(classifyBot('CURL'), {
      classification: 'nefarious',
      category: 'CATEGORY:TOOL',
    });
    assert.deepEqual(classifyBot('PYTHON_REQUESTS'), {
      classification: 'nefarious',
      category: 'CATEGORY:PROGRAMMATIC',
    });
  });

  test('nefarious: UNKNOWN_BOT and HEADLESS_* even with no category', () => {
    assert.deepEqual(classifyBot('UNKNOWN_BOT'), {
      classification: 'nefarious',
      category: '',
    });
    assert.equal(classifyBot('HEADLESS_CHROME').classification, 'nefarious');
    assert.equal(
      classifyBot('HEADLESS_SOMETHING_NEW', {}).classification,
      'nefarious',
    );
  });

  test('multi-category: the most severe wins (nefarious > seo)', () => {
    const map = {
      'CATEGORY:ADVERTISING': ['DUAL_BOT'],
      'CATEGORY:AI': ['DUAL_BOT'],
    };
    assert.deepEqual(classifyBot('DUAL_BOT', map), {
      classification: 'nefarious',
      category: 'CATEGORY:AI',
    });
  });

  test('multi-category in the real map: COMMONCRAWL is academic+ai+archive -> nefarious', () => {
    const result = classifyBot('COMMONCRAWL_CRAWLER');
    assert.equal(result.classification, 'nefarious');
    assert.ok(NEFARIOUS_CATEGORIES.has(result.category));
  });

  test('a named SEO vendor in a nefarious category is nefarious (severity wins)', () => {
    assert.ok(ARCJET_CATEGORIES['CATEGORY:AI'].includes('BOTIFY_CRAWLER'));
    assert.equal(classifyBot('BOTIFY_CRAWLER').classification, 'nefarious');
  });

  test('seo + unknown categories -> seo', () => {
    const map = {
      'CATEGORY:UNKNOWN': ['MIXED_BOT'],
      'CATEGORY:OPTIMIZER': ['MIXED_BOT'],
    };
    assert.deepEqual(classifyBot('MIXED_BOT', map), {
      classification: 'seo',
      category: 'CATEGORY:OPTIMIZER',
    });
  });

  test('unknown: CATEGORY:UNKNOWN bot not named as a vendor', () => {
    const bot = ARCJET_CATEGORIES['CATEGORY:UNKNOWN'].find(
      (b) => !SEO_VENDOR_BOTS.has(b),
    );
    assert.ok(bot);
    assert.deepEqual(classifyBot(bot), {
      classification: 'unknown',
      category: 'CATEGORY:UNKNOWN',
    });
  });

  test('unknown: a bot in no category at all', () => {
    assert.deepEqual(classifyBot('NOT_A_REAL_BOT'), {
      classification: 'unknown',
      category: '',
    });
  });

  test('unknown: an allowed-class category such as SEARCH_ENGINE', () => {
    assert.equal(classifyBot('GOOGLE_CRAWLER').classification, 'unknown');
  });

  test('a category label is classified directly', () => {
    assert.deepEqual(classifyBot('CATEGORY:BOTNET'), {
      classification: 'nefarious',
      category: 'CATEGORY:BOTNET',
    });
    assert.deepEqual(classifyBot('CATEGORY:ADVERTISING'), {
      classification: 'seo',
      category: 'CATEGORY:ADVERTISING',
    });
    assert.equal(classifyBot('CATEGORY:SOCIAL').classification, 'unknown');
  });
});

describe('classifyBlockedTraffic (ISS-2366)', () => {
  test('bot denial: first bot is reported, most severe label decides', () => {
    assert.deepEqual(
      classifyBlockedTraffic({
        deniedBots: ['SEMRUSH_CRAWLER', 'CURL'],
        reasonType: 'BOT',
      }),
      {
        classification: 'nefarious',
        bot: 'SEMRUSH_CRAWLER',
        category: 'CATEGORY:TOOL',
        reason: 'bot',
      },
    );
  });

  test('bot denial with a single seo bot', () => {
    assert.deepEqual(
      classifyBlockedTraffic({
        deniedBots: ['AHREFS_SITE_AUDIT'],
        reasonType: 'BOT',
      }),
      {
        classification: 'seo',
        bot: 'AHREFS_SITE_AUDIT',
        category: 'CATEGORY:ADVERTISING',
        reason: 'bot',
      },
    );
  });

  test('filter denial is nefarious with no bot or category', () => {
    assert.deepEqual(
      classifyBlockedTraffic({ deniedBots: [], reasonType: 'FILTER' }),
      { classification: 'nefarious', bot: '', category: '', reason: 'filter' },
    );
  });

  test('bot denial with no labels is unknown', () => {
    assert.deepEqual(
      classifyBlockedTraffic({ deniedBots: [], reasonType: 'BOT' }),
      { classification: 'unknown', bot: '', category: '', reason: 'bot' },
    );
  });

  test('empty reason type is reported as unknown', () => {
    assert.equal(
      classifyBlockedTraffic({ deniedBots: ['CURL'], reasonType: '' }).reason,
      'unknown',
    );
  });
});
