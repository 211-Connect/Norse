import { FilterBucket } from '@/types/search';

export const sanitizeFacetKey = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const isNonEmptyBucketValue = (value?: string | null): value is string =>
  value != null && value !== '';

export const getRenderableBuckets = (
  buckets: FilterBucket[],
  excludedForKey?: Set<string>,
): FilterBucket[] =>
  buckets
    .filter(
      (bucket) =>
        isNonEmptyBucketValue(bucket.key) &&
        isNonEmptyBucketValue(bucket.display),
    )
    .filter(
      (bucket) => !excludedForKey?.has(bucket.key.trim().toLocaleLowerCase()),
    );

export const sortBucketsByDisplayName = (
  buckets: FilterBucket[],
): FilterBucket[] =>
  [...buckets].sort((left, right) => {
    const displayCompare = left.display.localeCompare(
      right.display,
      undefined,
      {
        sensitivity: 'base',
      },
    );

    if (displayCompare !== 0) {
      return displayCompare;
    }

    return left.key.localeCompare(right.key, undefined, {
      sensitivity: 'base',
    });
  });

export const sortBucketsByCustomValueOrder = (
  buckets: FilterBucket[],
  valueOrder?: string[],
): FilterBucket[] => {
  if (!valueOrder?.length) {
    return buckets;
  }

  const orderIndexMap = new Map<string, number>();
  valueOrder.forEach((value, index) => {
    orderIndexMap.set(value.trim().toLocaleLowerCase(), index);
  });

  return [...buckets].sort((left, right) => {
    const leftIndex = orderIndexMap.get(left.key.trim().toLocaleLowerCase());
    const rightIndex = orderIndexMap.get(right.key.trim().toLocaleLowerCase());

    const leftKnown = leftIndex !== undefined;
    const rightKnown = rightIndex !== undefined;

    if (leftKnown && rightKnown) {
      return leftIndex - rightIndex;
    }

    if (leftKnown) {
      return -1;
    }

    if (rightKnown) {
      return 1;
    }

    return 0;
  });
};

const DAY_OF_WEEK_ALIASES = [
  ['sunday', 'sun'],
  ['monday', 'mon'],
  ['tuesday', 'tue', 'tues'],
  ['wednesday', 'wed'],
  ['thursday', 'thu', 'thur', 'thurs'],
  ['friday', 'fri'],
  ['saturday', 'sat'],
] as const;

const DAY_OF_WEEK_INDEX_MAP = DAY_OF_WEEK_ALIASES.reduce(
  (map, aliases, index) => {
    aliases.forEach((alias) => map.set(alias, index));
    return map;
  },
  new Map<string, number>(),
);

const normalizeDayToken = (value?: string | null): string =>
  value?.trim().toLocaleLowerCase() ?? '';

const getDayOfWeekSortIndex = (bucket: FilterBucket): number | undefined => {
  const keyIndex = DAY_OF_WEEK_INDEX_MAP.get(normalizeDayToken(bucket.key));
  if (keyIndex !== undefined) {
    return keyIndex;
  }

  return DAY_OF_WEEK_INDEX_MAP.get(normalizeDayToken(bucket.display));
};

export const sortBucketsByDayOfWeek = (
  buckets: FilterBucket[],
): FilterBucket[] =>
  [...buckets].sort((left, right) => {
    const leftIndex = getDayOfWeekSortIndex(left);
    const rightIndex = getDayOfWeekSortIndex(right);

    const leftKnown = leftIndex !== undefined;
    const rightKnown = rightIndex !== undefined;

    if (leftKnown && rightKnown) {
      return leftIndex - rightIndex;
    }

    if (leftKnown) {
      return -1;
    }

    if (rightKnown) {
      return 1;
    }

    return 0;
  });
