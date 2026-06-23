'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { HEADER_ID } from '@/app/(app)/shared/lib/constants';

import { MAX_VISIBLE_FILTERS } from './constants';
import {
  getRenderableBuckets,
  sanitizeFacetKey,
  sortBucketsByCustomValueOrder,
  sortBucketsByDisplayName,
} from './filter-utils';
import { FilterOptionRow } from './filter-option-row';
import { FilterGroupProps } from './types';

export function FilterGroup({
  idPrefix,
  facetKey,
  heading,
  buckets,
  excludedForKey,
  currentFilters,
  isPending,
  onToggle,
  sortMode,
  customValueOrder,
}: FilterGroupProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const expandButtonRef = useRef<HTMLButtonElement | null>(null);
  const firstHiddenFilterRef = useRef<HTMLButtonElement | null>(null);

  const sanitizedKey = useMemo(() => sanitizeFacetKey(facetKey), [facetKey]);

  const renderableBuckets = useMemo(
    () => getRenderableBuckets(buckets, excludedForKey),
    [buckets, excludedForKey],
  );

  const sortedBuckets = useMemo(() => {
    if (sortMode === 'name') {
      return sortBucketsByDisplayName(renderableBuckets);
    }

    if (sortMode === 'valueOrder') {
      return sortBucketsByCustomValueOrder(renderableBuckets, customValueOrder);
    }

    return renderableBuckets;
  }, [customValueOrder, renderableBuckets, sortMode]);

  const visibleBuckets = sortedBuckets.slice(0, MAX_VISIBLE_FILTERS);
  const hiddenBuckets = sortedBuckets.slice(MAX_VISIBLE_FILTERS);
  const expandedListId = `filter-group-options-${sanitizedKey}`;
  const checkboxIdBase = `${idPrefix}-filter-${sanitizedKey}`;

  const toggleExpanded = useCallback((expanded: boolean) => {
    setIsExpanded(expanded);

    window.requestAnimationFrame(() => {
      if (expanded) {
        firstHiddenFilterRef.current?.focus();
        firstHiddenFilterRef.current?.scrollIntoView({
          block: 'nearest',
        });
        return;
      }

      expandButtonRef.current?.focus({ preventScroll: true });
      const element = expandButtonRef.current;

      if (element) {
        const header = document.getElementById(HEADER_ID);
        const headerHeight = header?.offsetHeight ?? 0;
        const rect = element.getBoundingClientRect();

        if (rect.top < headerHeight + 8) {
          window.scrollBy({
            top: rect.top - headerHeight - 8,
            behavior: 'smooth',
          });
        }
      }
    });
  }, []);

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="sr-only">{heading}</legend>
      <h3 className="font-medium">{heading}</h3>
      <div className="flex flex-col gap-2">
        {visibleBuckets.map((bucket, index) => (
          <FilterOptionRow
            key={bucket.key}
            bucket={bucket}
            checkboxId={`${checkboxIdBase}-${index}`}
            countId={`${idPrefix}-filter-count-${sanitizedKey}-${index}`}
            checked={currentFilters[facetKey]?.includes(bucket.key) ?? false}
            disabled={isPending}
            onToggle={(checked) => onToggle(facetKey, bucket.key, checked)}
          />
        ))}

        {hiddenBuckets.length > 0 && isExpanded && (
          <div id={expandedListId} className="flex flex-col gap-2">
            {hiddenBuckets.map((bucket, index) => {
              const hiddenIndex = visibleBuckets.length + index;

              return (
                <FilterOptionRow
                  key={bucket.key}
                  bucket={bucket}
                  checkboxId={`${checkboxIdBase}-${hiddenIndex}`}
                  countId={`${idPrefix}-filter-count-${sanitizedKey}-${hiddenIndex}`}
                  checked={
                    currentFilters[facetKey]?.includes(bucket.key) ?? false
                  }
                  disabled={isPending}
                  onToggle={(checked) =>
                    onToggle(facetKey, bucket.key, checked)
                  }
                  checkboxRef={(element) => {
                    if (index === 0) {
                      firstHiddenFilterRef.current = element;
                    }
                  }}
                />
              );
            })}
          </div>
        )}

        {renderableBuckets.length > MAX_VISIBLE_FILTERS && (
          <Button
            ref={expandButtonRef}
            variant="link"
            size="sm"
            className="w-fit px-0"
            aria-controls={expandedListId}
            aria-expanded={isExpanded}
            onClick={() => toggleExpanded(!isExpanded)}
          >
            {isExpanded
              ? t('search.show_less', { ns: 'common' })
              : t('search.show_all', {
                  ns: 'common',
                  count: renderableBuckets.length,
                })}
          </Button>
        )}
      </div>
    </fieldset>
  );
}
