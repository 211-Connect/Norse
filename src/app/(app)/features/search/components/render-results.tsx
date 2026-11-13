'use client';

import { Check } from 'lucide-react';
import { useMemo } from 'react';

import { useSearchResults } from '../context/search-results-context';
import { labelOf } from '../sune-demo/sune.mjs';
import { FAMILIES } from '../sune-demo/vocabulary.mjs';
import { SearchCardLayoutConfig } from '../types/card-layout-config';
import {
  groupByMatchedNeeds,
  type NeedsGroup,
  useV2Search,
  useV2Url,
} from '../v2/use-v2-search';
import { CardLayoutRenderer } from './card-layout-renderer';
import { NoResultsCard } from './no-results-card';

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
  const { needs } = useV2Url();

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
  const noMatch =
    currentPage === 1 && groups.length > 0 && groups.every((g) => g === 'none');

  return (
    <>
      {results.length === 0 && <NoResultsCard />}
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
        return (
          // Prototype: a marker with no box, so the help button can find the 3rd card.
          <div
            key={result._id}
            className="contents"
            data-search-result
            data-needs-group={group ?? undefined}
          >
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
                      <li
                        key={code}
                        className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                      >
                        <Check className="size-3" aria-hidden="true" />
                        {needLabel(code)}
                      </li>
                    ))}
                  </ul>
                )
              }
            />
          </div>
        );
      })}
    </>
  );
}
