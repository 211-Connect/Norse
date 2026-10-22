import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Field } from 'payload';

import { topics } from '../src/payload/collections/ResourceDirectories/tabs/topics';
import {
  SUBTOPIC_QUERY_TYPE_REQUIRED,
  validateSubtopicQueryType,
} from '../src/payload/collections/ResourceDirectories/utilities/validateSubtopicQueryType';

const OPTIONS = ['taxonomy', 'text', 'link'];

/** The arguments Payload passes a select field's validator, as far as the built-in check reads them. */
const args = {
  options: OPTIONS,
  req: { t: (key: string) => key },
} as unknown as Parameters<typeof validateSubtopicQueryType>[1];

/** Depth-first search for a named field inside a tab's fields, rows and arrays. */
function findField(fields: Field[], path: string[]): Field {
  for (const field of fields) {
    if ('name' in field && field.name === path[0]) {
      if (path.length === 1) return field;
      if ('fields' in field) return findField(field.fields, path.slice(1));
    }
    if (field.type === 'row') {
      try {
        return findField(field.fields, path);
      } catch {
        // not in this row
      }
    }
  }
  throw new Error(`field ${path.join('.')} not found`);
}

test('a subtopic with no query type and no href is rejected', async () => {
  for (const value of [null, undefined, '']) {
    assert.equal(
      await validateSubtopicQueryType(value as never, args),
      SUBTOPIC_QUERY_TYPE_REQUIRED,
    );
  }
});

test('a legacy link subtopic (an href, no query type) is accepted', async () => {
  const withHref = { ...args, siblingData: { href: 'https://example.org' } };
  assert.equal(await validateSubtopicQueryType(null as never, withHref), true);
  const blankHref = { ...args, siblingData: { href: '  ' } };
  assert.equal(
    await validateSubtopicQueryType(null as never, blankHref),
    SUBTOPIC_QUERY_TYPE_REQUIRED,
  );
});

test('every query type option is accepted', async () => {
  for (const value of OPTIONS) {
    assert.equal(await validateSubtopicQueryType(value as never, args), true);
  }
});

test('the subtopic queryType field in the topics tab uses the validator', () => {
  const field = findField(topics.fields, ['list', 'subtopics', 'queryType']);
  assert.equal(
    'validate' in field && field.validate,
    validateSubtopicQueryType,
  );
});
