// Cut-over scaffolding (ISS-2373): deleted by ISS-2377.
//
// Replay: the search page run with parseSearchParams and parseLegacyAiClarifyParams replaced by the lift,
// mapped back onto their shapes, must reproduce the recorded snapshots exactly. Only the search page calls
// the parsers, so its two harnesses are the ones replayed.
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const { runParity } = await import('./parity-runner');
const { liftSearchParams, toFindResourcesQuery, toLegacyAiClarifyState } =
  await import('../../../src/app/(app)/features/search/intent');

const calls = { query: 0, clarify: 0 };
mock.module('@/app/(app)/features/search/utils/parseSearchParams', {
  namedExports: {
    parseSearchParams: (raw: Parameters<typeof liftSearchParams>[0]) => {
      calls.query++;
      return toFindResourcesQuery(liftSearchParams(raw).intent);
    },
  },
});
mock.module('@/app/(app)/features/search/utils/parseLegacyAiClarifyParams', {
  namedExports: {
    parseLegacyAiClarifyParams: (
      raw: Parameters<typeof liftSearchParams>[0],
    ) => {
      calls.clarify++;
      return toLegacyAiClarifyState(liftSearchParams(raw).intent);
    },
  },
});

runParity(['server-page', 'server-page-writer-output']);

// Without this, a mock that never took effect would replay the old parsers and pass.
test('the replay ran on the lift, not the old parsers', () => {
  assert.ok(calls.query > 0, 'the lift never replaced parseSearchParams');
  assert.ok(
    calls.clarify > 0,
    'the lift never replaced parseLegacyAiClarifyParams',
  );
});
