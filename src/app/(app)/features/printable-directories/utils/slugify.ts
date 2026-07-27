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
