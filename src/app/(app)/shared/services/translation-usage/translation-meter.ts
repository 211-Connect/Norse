import type { BatchTranslationResult } from '@/payload/services/translationService';

import { countCharacters } from './translation-usage-limits';

/**
 * Accumulates the translation usage of one save (which may translate
 * several fields, concurrently) so it is recorded once. Only cache misses
 * are billed; cache hits count toward `requestedCharacters` only.
 */
export type TranslationMeter = {
  record: (results: BatchTranslationResult[]) => void;
  readonly billedCharacters: number;
  readonly requestedCharacters: number;
  readonly largestFieldCharacters: number;
  readonly locales: string[];
};

export function createTranslationMeter(): TranslationMeter {
  let billedCharacters = 0;
  let requestedCharacters = 0;
  let largestFieldCharacters = 0;
  const locales = new Set<string>();

  return {
    record(results) {
      for (const result of results) {
        const characters = countCharacters(result.text);
        requestedCharacters += characters;
        largestFieldCharacters = Math.max(largestFieldCharacters, characters);
        locales.add(result.targetLocale);
        if (!result.fromCache) {
          billedCharacters += characters;
        }
      }
    },
    get billedCharacters() {
      return billedCharacters;
    },
    get requestedCharacters() {
      return requestedCharacters;
    },
    get largestFieldCharacters() {
      return largestFieldCharacters;
    },
    get locales() {
      return Array.from(locales).sort();
    },
  };
}
