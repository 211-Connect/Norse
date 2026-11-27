import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { withMenuNameFallback } from '../src/app/(app)/shared/utils/customMenu';
import { ResourceDirectory } from '../src/payload/payload-types';
import { getChangedLocalizedPaths } from '../src/payload/utilities/getChangedLocalizedPaths';

const english = [
  { id: 'a', name: 'Crisis Center', href: 'https://example.org/' },
  { id: 'b', name: 'New Program Form', href: 'https://example.org/new' },
];

describe('withMenuNameFallback', () => {
  it('shows the English name when a locale has none', () => {
    const spanish = [
      { id: 'a', name: 'Centro de crisis', href: 'https://example.org/' },
      { id: 'b', name: null, href: 'https://example.org/new' },
    ];
    assert.deepEqual(
      withMenuNameFallback(spanish, english).map((item) => item.name),
      ['Centro de crisis', 'New Program Form'],
    );
  });

  it('treats a blank name as missing', () => {
    const spanish = [{ id: 'a', name: '  ', href: 'https://example.org/' }];
    assert.equal(
      withMenuNameFallback(spanish, english)[0].name,
      'Crisis Center',
    );
  });

  it('drops an item with no name in any locale', () => {
    assert.deepEqual(
      withMenuNameFallback([{ id: 'c', name: null, href: '/x' }], english),
      [],
    );
  });

  it('returns an empty menu for no items', () => {
    assert.deepEqual(withMenuNameFallback(undefined, english), []);
  });
});

describe('getChangedLocalizedPaths for menus', () => {
  const doc = (header: string[], footer: string[] = []) =>
    ({
      header: {
        customMenu: header.map((name, index) => ({ id: `h${index}`, name })),
      },
      footer: {
        customMenu: footer.map((name, index) => ({ id: `f${index}`, name })),
      },
    }) as unknown as ResourceDirectory;

  it('reports a renamed or added menu item', () => {
    assert.deepEqual(
      getChangedLocalizedPaths(
        doc(['Home'], ['Legal']),
        doc(['Start', 'New'], ['Legal']),
      ),
      ['header.customMenu.0.name', 'header.customMenu.1.name'],
    );
  });

  it('ignores menus that did not change', () => {
    assert.deepEqual(
      getChangedLocalizedPaths(
        doc(['Home'], ['Legal']),
        doc(['Home'], ['Legal']),
      ),
      [],
    );
  });
});
