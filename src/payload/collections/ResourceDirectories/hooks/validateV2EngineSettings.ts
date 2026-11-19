import type { CollectionBeforeValidateHook } from 'payload';
import { ValidationError } from 'payload';

import { V2_HIDDEN_FIELDS, V2_ONLY_FIELD } from '../v2EngineFields';

type Settings = Record<string, unknown> & { searchEngine?: string | null };
type Shape = { search?: { searchSettings?: Settings | null } | null };

export type V2SettingsError = { path: string; message: string };

const settingsOf = (doc: Shape | undefined | null): Settings | undefined =>
  doc?.search?.searchSettings ?? undefined;

/**
 * Refuses edits that cannot take effect: a v2-hidden setting changed while the
 * engine is v2, or the v2-only setting changed while the engine is not v2.
 * A value counts as changed only when it differs from the stored one after
 * applying the default (a missing or null value equals the default).
 */
export function getV2SettingsError(
  data: Shape | undefined | null,
  originalDoc?: Shape | null,
): V2SettingsError | null {
  const incoming = settingsOf(data);
  const original = settingsOf(originalDoc);
  if (!incoming) return null;

  const incomingEngine = incoming.searchEngine;
  const engine =
    incomingEngine !== undefined ? incomingEngine : original?.searchEngine;
  const isV2 = engine === 'v2';

  const changed = (name: string, defaultValue: unknown): boolean => {
    const next = incoming[name];
    if (next === undefined) return false;
    return (next ?? defaultValue) !== (original?.[name] ?? defaultValue);
  };

  if (isV2) {
    for (const field of V2_HIDDEN_FIELDS) {
      if (changed(field.name, field.defaultValue)) {
        return {
          path: `search.searchSettings.${field.name}`,
          message: `"${field.label}" does not apply to the v2 search engine and cannot be changed while the engine is "v2 search".`,
        };
      }
    }
    return null;
  }

  if (changed(V2_ONLY_FIELD.name, V2_ONLY_FIELD.defaultValue)) {
    return {
      path: `search.searchSettings.${V2_ONLY_FIELD.name}`,
      message: `"${V2_ONLY_FIELD.label}" applies only to the v2 search engine. Pick "v2 search" first.`,
    };
  }
  return null;
}

export const validateV2EngineSettings: CollectionBeforeValidateHook = ({
  data,
  originalDoc,
}) => {
  const error = getV2SettingsError(data, originalDoc);
  if (error) {
    throw new ValidationError({ errors: [error] });
  }
  return data;
};
