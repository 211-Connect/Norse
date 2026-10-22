import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { GoogleTagManagerScript } from '../src/app/(app)/shared/components/google-tag-manager-script';

function render(containerId?: string, nonce?: string): string {
  return renderToStaticMarkup(
    createElement(GoogleTagManagerScript, { containerId, nonce }),
  );
}

test('server-renders the stock GTM loader as an inline script', () => {
  // Search Console's GTM verification reads the snippet from the server
  // HTML, so it must be a real <script>, not a next/script placeholder.
  const html = render('GTM-WQXT865', 'abc123');
  assert.match(html, /^<script id="google-tag-manager-script" nonce="abc123">/);
  assert.match(html, /'gtm\.start'/);
  assert.match(
    html,
    /https:\/\/www\.googletagmanager\.com\/gtm\.js\?id='\+i\+dl/,
  );
  assert.match(html, /j\.nonce='abc123';/);
  assert.ok(
    html.endsWith("'script','dataLayer','GTM-WQXT865');</script>"),
  );
});

test('omits the nonce assignment when no nonce is provided', () => {
  const html = render('GTM-WQXT865');
  assert.doesNotMatch(html, /j\.nonce/);
  assert.doesNotMatch(html, /nonce=/);
});

test('renders nothing when the tenant has no container id', () => {
  assert.equal(render(undefined), '');
  assert.equal(render(''), '');
});
