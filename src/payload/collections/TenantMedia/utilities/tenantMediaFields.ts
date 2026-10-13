import type { FlattenedField } from 'payload';

import type { TenantMedia } from '../../../payload-types';

type TenantMediaID = TenantMedia['id'];

const TENANT_MEDIA_SLUG = 'tenant-media';

const isTenantMediaUpload = (field: FlattenedField) =>
  field.type === 'upload' && field.relationTo === TENANT_MEDIA_SLUG;

/**
 * Dot-notation paths (usable in `where` queries) of every `tenant-media`
 * upload field, including ones nested in named tabs, groups and arrays.
 */
export function getTenantMediaFieldPaths(
  fields: FlattenedField[],
  prefix = '',
): string[] {
  return fields.flatMap((field) => {
    const path = `${prefix}${field.name}`;

    if (isTenantMediaUpload(field)) {
      return [path];
    }

    if (
      field.type === 'tab' ||
      field.type === 'group' ||
      field.type === 'array'
    ) {
      return getTenantMediaFieldPaths(field.flattenedFields, `${path}.`);
    }

    return [];
  });
}

/**
 * Walks `data` (a document shaped by `fields`) and replaces every
 * `tenant-media` upload value with the result of `map`. Populated values
 * are reduced to their ID. Mutates `data` in place.
 */
export function mapTenantMediaIDs(
  data: unknown,
  fields: FlattenedField[],
  map: (id: TenantMediaID) => TenantMediaID,
): void {
  if (!data || typeof data !== 'object') {
    return;
  }

  const record = data as Record<string, unknown>;

  for (const field of fields) {
    const value = record[field.name];

    if (value === null || value === undefined) {
      continue;
    }

    if (isTenantMediaUpload(field)) {
      record[field.name] = Array.isArray(value)
        ? value.map((item) => mapUploadValue(item, map))
        : mapUploadValue(value, map);
    } else if (field.type === 'tab' || field.type === 'group') {
      mapTenantMediaIDs(value, field.flattenedFields, map);
    } else if (field.type === 'array' && Array.isArray(value)) {
      for (const row of value) {
        mapTenantMediaIDs(row, field.flattenedFields, map);
      }
    }
  }
}

/** Collects the IDs of every `tenant-media` upload referenced by `data`. */
export function collectTenantMediaIDs(
  data: unknown,
  fields: FlattenedField[],
): Set<TenantMediaID> {
  const ids = new Set<TenantMediaID>();

  mapTenantMediaIDs(structuredClone(data), fields, (id) => {
    ids.add(id);
    return id;
  });

  return ids;
}

function mapUploadValue(
  value: unknown,
  map: (id: TenantMediaID) => TenantMediaID,
): unknown {
  if (typeof value === 'number') {
    return map(value);
  }

  if (value && typeof value === 'object' && 'id' in value) {
    return map((value as TenantMedia).id);
  }

  return value;
}
