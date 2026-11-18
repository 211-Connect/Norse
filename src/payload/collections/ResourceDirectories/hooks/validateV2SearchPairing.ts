import type { CollectionBeforeValidateHook } from 'payload';
import { ValidationError } from 'payload';

type PairingInput = {
  searchEngine?: string | null;
  enableV2Api?: boolean | null;
};

export const V2_ENGINE_NEEDS_FLAG_MESSAGE =
  'The "v2 search" engine requires "Enable v2 search API" to be on. Turn on the flag first.';

export const V2_FLAG_OFF_WHILE_ENGINE_MESSAGE =
  '"Enable v2 search API" cannot be turned off while the search engine is "v2 search". Pick another search engine first.';

type Shape = {
  search?: { searchSettings?: { searchEngine?: string | null } | null } | null;
  featureFlags?: { enableV2Api?: boolean | null } | null;
};

const read = (doc: Shape | undefined | null): PairingInput => ({
  searchEngine: doc?.search?.searchSettings?.searchEngine,
  enableV2Api: doc?.featureFlags?.enableV2Api,
});

/**
 * Merges the incoming (possibly partial) data over the stored doc. Returns an
 * error message when the state would be "v2 UX on the v1 API", else null.
 */
export function getV2PairingError(
  data: Shape | undefined | null,
  originalDoc?: Shape | null,
): string | null {
  const incoming = read(data);
  const original = read(originalDoc);
  const searchEngine =
    incoming.searchEngine !== undefined
      ? incoming.searchEngine
      : original.searchEngine;
  const enableV2Api =
    incoming.enableV2Api !== undefined
      ? incoming.enableV2Api
      : original.enableV2Api;

  if (searchEngine !== 'v2' || enableV2Api === true) return null;

  // Say which edit caused it: the flag was on and is now off, or the engine was set.
  return original.enableV2Api === true && incoming.enableV2Api === false
    ? V2_FLAG_OFF_WHILE_ENGINE_MESSAGE
    : V2_ENGINE_NEEDS_FLAG_MESSAGE;
}

export const validateV2SearchPairing: CollectionBeforeValidateHook = ({
  data,
  originalDoc,
}) => {
  const message = getV2PairingError(data, originalDoc);
  if (message) {
    throw new ValidationError({
      errors: [
        {
          path: 'search.searchSettings.searchEngine',
          message,
        },
      ],
    });
  }
  return data;
};
