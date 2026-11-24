'use client';

import { Check } from 'lucide-react';
import { Fragment, useMemo } from 'react';

import { Badge } from '@/app/(app)/shared/components/ui/badge';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

import { useSearchResults } from '../context/search-results-context';
import { labelOf } from '../sune-demo/sune.mjs';
import { FAMILIES } from '../sune-demo/vocabulary.mjs';
import { SearchCardLayoutConfig } from '../types/card-layout-config';
import {
  groupByMatchedNeeds,
  isWeakMatch,
  locationNote,
  type NeedsGroup,
  useV2Search,
  useV2Url,
} from '../v2/use-v2-search';
import { CardLayoutRenderer } from './card-layout-renderer';
import { NoResultsCard } from './no-results-card';
import { V2ErrorCard } from './v2-error-card';
import { useV2Failure } from './v2-failure-context';
import { weakMatchText } from '../v2/v2-results';

type RenderResultsProps = {
  cardLayout: SearchCardLayoutConfig;
};

/** A need's display label, never the raw code. Tier 1 codes (N-HOU) read from the families. */
export const needLabel = (code: string) => {
  const label = labelOf(code);
  if (label !== code) return label;
  return FAMILIES.find((f) => f.code === code)?.display ?? code;
};

/** The divider line before the first result of a group. "all" leads, so it has none. */
const DIVIDER: Record<NeedsGroup, string | null> = {
  all: null,
  some: 'Services that match some of your needs',
  none: 'Other services that may help',
};

export function RenderResults({ cardLayout }: RenderResultsProps) {
  const { results, currentPage } = useSearchResults();
  const { data } = useV2Search();
  const { needs, query } = useV2Url();
  const { failed, retry, retrying } = useV2Failure();
  const appConfig = useAppConfig();
  const contactNumber = appConfig?.contact?.number;
  const noResultsText = appConfig?.search?.texts?.noResultsFallbackText;
  // The tenant's v2 switch: off renders the v1 list, with no wrapper element.
  const v2 = appConfig?.featureFlags?.enableV2Api === true;

  // `matched_needs` comes on each v2 hit (Decision 56). The list keeps the server order.
  const matchedById = useMemo(
    () =>
      new Map(
        (data?.search?.hits.hits ?? []).map((hit) => [
          hit._id,
          hit.matched_needs,
        ]),
      ),
    [data],
  );
  const groups = groupByMatchedNeeds(
    results.map((result) => ({ matched_needs: matchedById.get(result._id) })),
    needs,
  );
  // Decision 49: no result matches a selected need, so the list is keyword matches only.
  // A hit with no `matched_needs` field means "not checked" (an index with no need tags); the
  // notice then would say "No services found" about services that were never tagged.
  const needsChecked = (data?.search?.hits.hits ?? []).some((hit) =>
    Array.isArray(hit.matched_needs),
  );
  // A weak match with no need picked has no results; the question beside them is the way on.
  const weak = isWeakMatch(data) && needs.length === 0;
  const noMatch =
    needsChecked &&
    currentPage === 1 &&
    groups.length > 0 &&
    groups.every((g) => g === 'none');

  const area = locationNote(data?.resolved_location);

  return (
    <>
      {area && (
        <p
          role="status"
          className="text-muted-foreground text-sm"
          data-testid="resolved-location"
        >
          {area}
        </p>
      )}
      {failed ? (
        <V2ErrorCard onRetry={retry} busy={retrying} />
      ) : (
        results.length === 0 && (
          <NoResultsCard
            text={
              weak ? weakMatchText(noResultsText, contactNumber) : undefined
            }
          />
        )
      )}
      {noMatch && (
        <p
          role="status"
          className="bg-muted rounded-lg border p-3 text-sm"
          data-testid="needs-no-match"
        >
          No services found for {needs.map(needLabel).join(' or ')}. These
          services match your search words.
        </p>
      )}
      {results.map((result, i) => {
        const group = groups[i];
        const divider =
          group && i > 0 && groups[i - 1] && group !== groups[i - 1]
            ? DIVIDER[group]
            : null;
        const matched = (matchedById.get(result._id) ?? []).filter((code) =>
          needs.includes(code),
        );
        const card = (
          <>
            {divider && (
              <h3
                className="text-muted-foreground border-t pt-3 text-sm font-semibold"
                data-testid="needs-divider"
              >
                {divider}
              </h3>
            )}
            <CardLayoutRenderer
              result={result}
              layout={cardLayout}
              footer={
                matched.length > 0 && (
                  <ul
                    aria-label="Matches your needs"
                    className="flex flex-wrap gap-1.5"
                    data-testid="matched-needs"
                  >
                    {matched.map((code) => (
                      <li key={code}>
                        <Badge
                          variant="default"
                          className="text-primary gap-1 rounded-full text-xs font-medium"
                        >
                          <Check className="size-3" aria-hidden="true" />
                          {needLabel(code)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )
              }
            />
          </>
        );
        // v2 only: a marker with no box, so the help button can find the 3rd card. The v1 list has no wrapper.
        return v2 ? (
          <div
            key={result._id}
            className="contents"
            data-search-result
            data-needs-group={group ?? undefined}
          >
            {card}
          </div>
        ) : (
          <Fragment key={result._id}>{card}</Fragment>
        );
      })}
    </>
  );
}
