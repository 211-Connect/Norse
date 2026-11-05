// A `'use server'` file registers every export as a Server Action: a public POST endpoint, whether or not a
// client component imports it (the build's server-reference manifest lists it either way). The search
// feature's server code is called by the search page directly, so none of it needs the directive, and a file
// that gains it becomes an endpoint that takes a caller-supplied tenant and calls ml-broker or the geocoder.
// ISS-2433 is where the actions a client really needs get their checks; this test keeps the rest closed.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

const SRC = join(import.meta.dirname, '../src');
const SEARCH = join(SRC, 'app/(app)/features/search');

/** Files under features/search that may be Server Actions, with why. None today. */
const ALLOWED: Record<string, string> = {};

/** True when the file's first statement is the `'use server'` directive (comments may precede it). */
export function isServerActionFile(source: string): boolean {
  const prologue = source.replace(
    /^(?:\s*(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/))*\s*/,
    '',
  );
  return /^['"]use server['"]/.test(prologue);
}

function serverActionFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name)) continue;
    const file = join(entry.parentPath, entry.name);
    if (isServerActionFile(readFileSync(file, 'utf8'))) {
      found.push(relative(SRC, file));
    }
  }
  return found.sort();
}

test('no file under features/search is a Server Action unless listed with a reason', () => {
  const files = readdirSync(SEARCH, { recursive: true }).filter((f) =>
    /\.(ts|tsx)$/.test(String(f)),
  );
  assert.ok(
    files.length >= 20,
    `only ${files.length} files: the scan is not reaching features/search`,
  );
  assert.deepStrictEqual(
    serverActionFiles(SEARCH),
    Object.keys(ALLOWED).sort(),
  );
});

test('the detector detects: a real Server Action file elsewhere is found', () => {
  // The geocoder is a Server Action a client component imports; if this stops being found, the detector is
  // broken and the test above is passing on nothing.
  const found = serverActionFiles(join(SRC, 'app/(app)/shared/serverActions'));
  assert.ok(
    found.includes(
      'app/(app)/shared/serverActions/geocoding/forwardGeocode.ts',
    ),
    `found: ${found.join(', ')}`,
  );
  assert.equal(
    isServerActionFile(
      "// a comment\n/* another */\n'use server';\nexport async function f() {}",
    ),
    true,
  );
  assert.equal(
    isServerActionFile("import x from 'y';\n'use server';\n"),
    false,
  );
});
