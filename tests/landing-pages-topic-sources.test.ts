import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  listTopicSources,
  sourceStatus,
} from '../src/app/(app)/features/landing-pages/lib/topicSources';

const directory = {
  topics: {
    list: [
      {
        name: 'Basic needs',
        subtopics: [
          { id: 's1', name: 'Food', queryType: 'taxonomy', query: 'BD-1800' },
          { id: 's2', name: 'Shelter', queryType: 'text', query: 'shelter' },
          { id: 's3', name: 'Apply online', queryType: 'link', query: null },
        ],
      },
    ],
  },
  suggestions: {
    suggestions: [
      { id: 'g1', value: 'Rent help', taxonomies: 'BH-3800.7000' },
      { id: 'g2', value: 'Empty', taxonomies: '' },
    ],
  },
};

describe('listTopicSources', () => {
  test('subtopics and suggestions, with link subtopics disabled', () => {
    const sources = listTopicSources(directory);
    assert.deepEqual(
      sources.map((s) => [s.kind, s.ref, s.label, s.disabledReason ?? null]),
      [
        ['subtopic', 's1', 'Food', null],
        ['subtopic', 's2', 'Shelter', null],
        ['subtopic', 's3', 'Apply online', 'Opens a link, not a search'],
        ['suggestion', 'g1', 'Rent help', null],
        ['suggestion', 'g2', 'Empty', 'Has no taxonomy codes'],
      ],
    );
    assert.equal(sources[0].group, 'Basic needs');
    assert.deepEqual(sources[3].search, {
      queryType: 'taxonomy',
      query: 'BH-3800.7000',
    });
  });

  test('an empty directory has no sources', () => {
    assert.deepEqual(listTopicSources({}), []);
  });
});

describe('sourceStatus', () => {
  const sources = listTopicSources(directory);
  const topic = (ref: string, query: string, label = 'Food') => ({
    source: { kind: 'subtopic' as const, ref, label },
    search: { queryType: 'taxonomy', query },
  });

  test('custom topics have no source', () => {
    assert.equal(
      sourceStatus({ source: { kind: 'custom' } }, sources).state,
      'custom',
    );
  });

  test('unchanged, changed and missing sources', () => {
    assert.equal(
      sourceStatus(topic('s1', 'BD-1800'), sources).state,
      'unchanged',
    );
    const changed = sourceStatus(
      topic('s1', 'BD-1800.2000', 'Groceries'),
      sources,
    );
    assert.equal(changed.state, 'changed');
    assert.deepEqual(changed.state === 'changed' && changed.what, [
      'search',
      'name',
    ]);
    assert.equal(
      sourceStatus(topic('gone', 'BD-1800'), sources).state,
      'missing',
    );
    assert.equal(sourceStatus(topic('s3', ''), sources).state, 'missing');
  });
});
