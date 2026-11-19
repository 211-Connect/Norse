/**
 * `norse.process.active_resources` (plan N5, optional).
 *
 * `process.getActiveResourcesInfo()` returns one entry per open handle/timer,
 * read when the metric is collected (an observable gauge), never from a timer
 * of ours. The list is unbounded in principle, so only the ten most common
 * types are reported and the rest are summed into `other` to keep cardinality
 * low.
 */

export const ACTIVE_RESOURCE_TYPE_LIMIT = 10;

export interface ActiveResourceCount {
  type: string;
  count: number;
}

export function countActiveResources(
  resources: readonly string[],
  limit: number = ACTIVE_RESOURCE_TYPE_LIMIT,
): ActiveResourceCount[] {
  const byType = new Map<string, number>();
  for (const type of resources) {
    byType.set(type, (byType.get(type) ?? 0) + 1);
  }

  // Ties broken by type name so the series set is stable between collections.
  const sorted = [...byType.entries()].sort(
    ([typeA, countA], [typeB, countB]) =>
      countB - countA || typeA.localeCompare(typeB),
  );

  if (sorted.length <= limit) {
    return sorted.map(([type, count]) => ({ type, count }));
  }

  const counts = new Map(sorted.slice(0, limit));
  const other = sorted.slice(limit).reduce((sum, [, count]) => sum + count, 0);
  counts.set('other', (counts.get('other') ?? 0) + other);

  return [...counts.entries()].map(([type, count]) => ({ type, count }));
}
