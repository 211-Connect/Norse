import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  fillCopy,
  fillCopyTags,
  fromI18nTags,
  pickCopy,
  regionDisplayName,
} from '../src/app/(app)/features/landing-pages/lib/copy';

const en = { county: '{{name}} County', place: '{{name}}, {{state}}' };
const es = { county: 'Condado de {{name}}', place: '{{name}}, {{state}}' };

describe('landing page copy', () => {
  test('each field comes from the most specific layer that has it', () => {
    const layers = {
      page: { title: 'Page title', h1: '  ' },
      topic: { h1: 'Topic h1', description: null },
      template: { description: 'Template description', h1: 'Template h1' },
      default: { intro: 'Default intro', title: 'Default title' },
    };
    assert.deepEqual(pickCopy(layers), {
      title: { text: 'Page title', source: 'page' },
      h1: { text: 'Topic h1', source: 'topic' },
      description: { text: 'Template description', source: 'template' },
      intro: { text: 'Default intro', source: 'default' },
    });
    // What a field inherits when its own layer is empty.
    assert.equal(pickCopy(layers, 'page').title?.source, 'default');
  });

  test('fills known tags, keeps unknown and double-brace ones', () => {
    const values = { topic: 'Food', location: 'Tacoma, WA', name: 'WA 211' };
    assert.equal(
      fillCopyTags('{topic} in {location} · {name} {{name}} {zip}', values),
      'Food in Tacoma, WA · WA 211 {{name}} {zip}',
    );
    assert.equal(
      fillCopyTags('Call {phone}, or {name}.', values),
      'Call, or WA 211.',
    );
    assert.equal(fillCopyTags('Aide : {topic} !', values), 'Aide : Food !');
    assert.deepEqual(
      fillCopy({ template: { title: '{topic} near {location}' } }, values),
      { title: 'Food near Tacoma, WA', description: '', h1: '', intro: '' },
    );
  });

  test('locale strings convert to copy tags', () => {
    assert.equal(
      fromI18nTags('{{topic}} en {{ location }}'),
      '{topic} en {location}',
    );
  });

  test('region names follow the locale', () => {
    const pierce = {
      type: 'county',
      name: 'Pierce County, WA',
      state: 'WA',
    } as const;
    assert.equal(regionDisplayName(pierce, en, 'Washington'), 'Pierce County');
    assert.equal(
      regionDisplayName(pierce, es, 'Washington'),
      'Condado de Pierce',
    );
    assert.equal(
      regionDisplayName(
        { type: 'county', name: 'Orleans Parish, LA', state: 'LA' },
        es,
        'Louisiana',
      ),
      'Orleans Parish',
    );
    assert.equal(
      regionDisplayName(
        { type: 'place', name: 'Tacoma', state: 'WA' },
        es,
        'Washington',
      ),
      'Tacoma, WA',
    );
    assert.equal(
      regionDisplayName(
        { type: 'state', name: 'Washington', state: 'WA' },
        es,
        'Washington',
      ),
      'Washington',
    );
  });
});
