import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { GoogleTagManagerNoscript } from '../src/app/(app)/shared/components/google-tag-manager-noscript';

function render(containerId?: string): string {
  return renderToStaticMarkup(
    createElement(GoogleTagManagerNoscript, { containerId }),
  );
}

test('renders the stock GTM noscript iframe for a container id', () => {
  // Search Console's GTM verification expects Google's snippet unmodified:
  // no extra attributes, no stray characters.
  assert.equal(
    render('GTM-WQXT865'),
    '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WQXT865" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>',
  );
});

test('renders nothing when the tenant has no container id', () => {
  assert.equal(render(undefined), '');
  assert.equal(render(''), '');
});
