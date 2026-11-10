/**
 * Anonymous favorites after a re-key (ISS-2516). The batch lookup returns a
 * re-keyed record under the old id that was asked for, and the record's own
 * id is the new one. `resolved` maps each requested id to the id its record
 * has now. Returns the stored ids with every renamed id replaced in place,
 * duplicates collapsed, and ids that did not resolve kept as they were. It
 * returns null when nothing was renamed, so storage is not rewritten.
 */
export function renameLocalFavoriteIds(
  stored: string[],
  resolved: Record<string, string>,
): string[] | null {
  let renamed = false;
  const next: string[] = [];
  for (const id of stored) {
    const current = resolved[id] ?? id;
    if (current !== id) renamed = true;
    if (!next.includes(current)) next.push(current);
  }
  return renamed ? next : null;
}
