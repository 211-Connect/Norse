import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';

import {
  RESERVED_TOPIC_SLUGS,
  localizedLandingHref,
  placeSlug,
  slugify,
  topicSlugFor,
  topicSlugProblem,
  uniquePlaceSlugs,
} from '../src/app/(app)/features/landing-pages/lib/slugs';

/** Static route folders, skipping groups `(x)`, dynamic `[x]` and private `_x`. */
function routeFolders(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !/^[([_]/.test(name));
}

describe('reserved topic slugs', () => {
  test('cover every route folder a landing path could collide with', () => {
    const app = path.join(import.meta.dirname, '../src/app/(app)/[locale]');
    const folders = [
      ...routeFolders(app),
      ...routeFolders(path.join(app, '(rest)')),
      ...routeFolders(path.join(app, '(home)')),
    ];
    assert.ok(folders.length > 0);
    for (const folder of folders) {
      assert.ok(
        RESERVED_TOPIC_SLUGS.has(folder),
        `add "${folder}" to RESERVED_TOPIC_SLUGS`,
      );
    }
  });

  test('a reserved or locale slug is rejected', () => {
    assert.match(topicSlugProblem('search') ?? '', /used by another page/);
    assert.match(topicSlugProblem('es') ?? '', /used by another page/);
    assert.equal(topicSlugProblem('food-assistance'), null);
  });

  test('a badly formed slug is rejected', () => {
    assert.ok(topicSlugProblem(''));
    assert.ok(topicSlugProblem('Food'));
    assert.ok(topicSlugProblem('food--bank'));
    assert.ok(topicSlugProblem('-food'));
    assert.ok(topicSlugProblem('a'.repeat(81)));
  });
});

describe('slugify', () => {
  test('drops accents and apostrophes', () => {
    assert.equal(slugify('Alimentación y comida'), 'alimentacion-y-comida');
    assert.equal(slugify("Coeur d'Alene"), 'coeur-dalene');
    assert.equal(slugify('  Rent & Utilities!  '), 'rent-utilities');
  });

  test('non-Latin text gives an empty slug', () => {
    assert.equal(slugify('食物'), '');
  });
});

describe('topicSlugFor', () => {
  test('uses the translated name when it slugifies', () => {
    assert.equal(topicSlugFor('Alimentos', 'food'), 'alimentos');
  });

  test('falls back for non-Latin or reserved names', () => {
    assert.equal(topicSlugFor('食物', 'food'), 'food');
    assert.equal(topicSlugFor('Search', 'search-help'), 'search-help');
  });
});

describe('place slugs', () => {
  test('state, county and place', () => {
    assert.equal(
      placeSlug({ id: 'state:WA', type: 'state', name: 'WA', state: 'WA' }),
      'washington',
    );
    assert.equal(
      placeSlug({
        id: 'county:53053',
        type: 'county',
        name: 'Pierce County, WA',
        state: 'WA',
      }),
      'pierce-county-wa',
    );
    assert.equal(
      placeSlug({
        id: 'county:22071',
        type: 'county',
        name: 'Orleans Parish, LA',
        state: 'LA',
      }),
      'orleans-parish-la',
    );
    assert.equal(
      placeSlug({
        id: 'place:5370000',
        type: 'place',
        name: 'Tacoma',
        state: 'WA',
      }),
      'tacoma-wa',
    );
  });

  test('clashing names get the county, then the id', () => {
    const slugs = uniquePlaceSlugs([
      {
        id: 'place:5300001',
        type: 'place',
        name: 'Fairview',
        state: 'WA',
        countyName: 'Yakima County, WA',
      },
      {
        id: 'place:5300002',
        type: 'place',
        name: 'Fairview',
        state: 'WA',
        countyName: 'Spokane County, WA',
      },
      {
        id: 'place:5300003',
        type: 'place',
        name: 'Fairview',
        state: 'WA',
        countyName: 'Spokane County, WA',
      },
    ]);
    assert.equal(slugs.get('place:5300001'), 'fairview-wa');
    assert.equal(slugs.get('place:5300002'), 'fairview-spokane-county-wa');
    assert.equal(
      slugs.get('place:5300003'),
      'fairview-spokane-county-wa-5300003',
    );
  });
});

describe('localizedLandingHref', () => {
  test('no prefix on the default locale', () => {
    assert.equal(
      localizedLandingHref('food/tacoma-wa', 'en', 'en'),
      '/food/tacoma-wa',
    );
    assert.equal(
      localizedLandingHref('alimentos/tacoma-wa', 'es', 'en'),
      '/es/alimentos/tacoma-wa',
    );
  });
});
