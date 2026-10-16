/**
 * Converts free text into a URL-safe, kebab-case slug.
 *
 * @example slugify('Title text') // 'title-text'
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Short random alphanumeric suffix used to avoid slug collisions when a slug
 * is auto-generated without user input (e.g. when cloning a directory).
 */
export function randomSlugSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Shortest directory name; also the API's minimum slug length. */
export const MIN_DIRECTORY_NAME_LENGTH = 3;
export const MIN_SLUG_LENGTH = 3;
/** The API's maximum slug length, less room for a collision suffix. */
const MAX_BASE_SLUG_LENGTH = 110;

export function isDirectoryNameValid(name: string): boolean {
  return name.trim().length >= MIN_DIRECTORY_NAME_LENGTH;
}

/** A typed share-URL slug the API would reject for being too short. */
export function isSlugTooShort(slug: string): boolean {
  const trimmed = slug.trim();
  return trimmed.length > 0 && slugify(trimmed).length < MIN_SLUG_LENGTH;
}

/**
 * The slug a directory name produces, valid for the API (3–120 characters).
 * Names with too few Latin letters or digits (e.g. "PD", or a name in
 * another script) fall back to `directory`; callers add a suffix on
 * collision.
 */
export function baseSlugFromName(name: string): string {
  const slug = slugify(name).slice(0, MAX_BASE_SLUG_LENGTH).replace(/-+$/, '');
  return slug.length >= MIN_SLUG_LENGTH ? slug : 'directory';
}
