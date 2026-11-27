/**
 * `public/locales/<locale>/landing-pages.json`: every locale has every
 * English string, with the same placeholders, so no page falls back to
 * English or loses a variable.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';

const dir = join(process.cwd(), 'public/locales');
const read = (locale: string) =>
  JSON.parse(readFileSync(join(dir, locale, 'landing-pages.json'), 'utf8'));

const flatten = (node: unknown, prefix = ''): Record<string, string> =>
  Object.entries(node as Record<string, unknown>).reduce(
    (out, [key, value]) =>
      typeof value === 'object' && value !== null
        ? { ...out, ...flatten(value, `${prefix}${key}.`) }
        : { ...out, [`${prefix}${key}`]: String(value) },
    {} as Record<string, string>,
  );

const tags = (text: string) =>
  [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort();

const english = flatten(read('en'));
const locales = readdirSync(dir).filter((locale) => locale !== 'en');

describe('landing-page locale files', () => {
  for (const locale of locales) {
    test(locale, () => {
      const strings = flatten(read(locale));
      for (const [key, source] of Object.entries(english)) {
        const value = strings[key];
        assert.ok(value?.trim(), `${locale}: ${key} is missing`);
        assert.deepEqual(tags(value), tags(source), `${locale}: ${key} tags`);
      }
    });
  }
});
