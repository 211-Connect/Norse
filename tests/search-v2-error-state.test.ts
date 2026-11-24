// A failed v2 call shows the v2 error state with retry, never the v1 cards (PR 1237, item 6).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { appConfigContext } from '../src/app/(app)/shared/context/app-config-context';
import { V2ErrorCard } from '../src/app/(app)/features/search/components/v2-error-card';
import {
  V2FailureProvider,
  useV2Failure,
} from '../src/app/(app)/features/search/components/v2-failure-context';

const read = (path: string) => readFileSync(path, 'utf8');
const APP = 'src/app/(app)/features/search/components/';

const withConfig = (el: ReturnType<typeof createElement>, number?: string) =>
  createElement(
    appConfigContext.Provider,
    { value: { contact: number ? { number } : {} } as never },
    el,
  );

test('error card: alert role, text, a Retry button of 44 px, and the tenant phone', () => {
  const html = renderToStaticMarkup(
    withConfig(
      createElement(V2ErrorCard, { onRetry: () => undefined, busy: false }),
      '555-0100',
    ),
  );
  assert.match(html, /role="alert"/);
  assert.match(html, /data-testid="v2-search-error"/);
  assert.match(html, /We could not load your results\./);
  assert.match(html, /Try again/);
  assert.match(html, /min-h-11/);
  assert.doesNotMatch(html, /<button[^>]* disabled=""/);
  assert.match(html, /aria-busy="false"/);
  assert.match(html, /tel:555-0100/);
  assert.doesNotMatch(html, /no-results-card/);
});

test('error card: busy disables Retry and sets aria-busy; no phone when the tenant has none', () => {
  const html = renderToStaticMarkup(
    withConfig(
      createElement(V2ErrorCard, { onRetry: () => undefined, busy: true }),
    ),
  );
  assert.match(html, /<button[^>]* disabled=""/);
  assert.match(html, /aria-busy="true"/);
  assert.doesNotMatch(html, /tel:/);
});

test('v1 and a working v2 call: the failure context defaults to not failed', () => {
  const Probe = () => {
    const f = useV2Failure();
    return createElement('span', null, String(f.failed));
  };
  assert.match(renderToStaticMarkup(createElement(Probe)), /false/);
  const html = renderToStaticMarkup(
    createElement(
      V2FailureProvider,
      { value: { failed: true, retry: () => undefined, retrying: false } },
      createElement(Probe),
    ),
  );
  assert.match(html, /true/);
});

test('page-search.json has the error keys in en and es', () => {
  for (const [lang, title, retry] of [
    ['en', 'We could not load your results.', 'Try again'],
    ['es', 'No pudimos cargar los resultados.', 'Intentar de nuevo'],
  ]) {
    const json = JSON.parse(read(`public/locales/${lang}/page-search.json`));
    assert.equal(json.v2_error_title, title, lang);
    assert.equal(json.v2_error_retry, retry, lang);
  }
});

test('wiring: the bridge, RenderResults and ResultsSection read the failure', () => {
  const bridge = read(`${APP}v2-results-bridge.tsx`);
  assert.match(bridge, /v2CallFailed\(/);
  assert.match(bridge, /pinsQuery: null/);
  assert.match(bridge, /refetch/);
  const render = read(`${APP}render-results-v2.tsx`);
  assert.match(render, /useV2Failure\(\)/);
  assert.match(render, /failed \? \(\s*<V2ErrorCard/);
  const section = read(`${APP}results-section.tsx`);
  assert.match(section, /useV2Failure\(\)/);
  assert.match(section, /!failed && /);
});

test('the guide error text no longer says the results are ready', () => {
  const guide = read('src/app/(app)/shared/components/search/search-guide.tsx');
  assert.match(guide, /We could not load the next question\./);
  assert.doesNotMatch(guide, /Your results are ready/);
});
