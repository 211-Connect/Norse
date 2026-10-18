// Cut-over scaffolding (ISS-2373): deleted by ISS-2377.
import assert from 'node:assert/strict';

import { ALL_FIXTURES } from '../../search-intent-fixtures';
import { loadCorpus, readSnapshot } from './snapshots';

/** Every query string to lift, with where it came from. */
export function liftInputs(): Map<string, string> {
  const inputs = new Map<string, string>();
  for (const row of loadCorpus())
    inputs.set(row.query, `corpus ${row.scenario}`);
  // The permanent fixtures too, so each one is proved to be today's reading, not just asserted.
  for (const f of ALL_FIXTURES) inputs.set(f.query, `fixture ${f.name}`);
  const writers = readSnapshot('server-page-writer-output');
  const pages = readSnapshot('server-page');
  assert.ok(writers && pages, 'snapshots missing: nothing would be compared');
  for (const id of writers.keys()) {
    const url = id.slice(0, id.indexOf('|'));
    inputs.set(url.split('?')[1] ?? '', `writer ${url.slice(0, 80)}`);
  }
  for (const [id, output] of [...pages, ...writers]) {
    const redirect = (JSON.parse(output) as { redirect?: string }).redirect;
    if (redirect) inputs.set(redirect.split('?')[1] ?? '', `redirect ${id}`);
  }
  return inputs;
}
