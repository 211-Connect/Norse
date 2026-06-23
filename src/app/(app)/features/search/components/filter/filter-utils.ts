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
