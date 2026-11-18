'use client';

import Link from 'next/link';

import { seedHits, seedTotal } from '../v2/v2-seed';
import type { V2Response } from '../v2/v2-contract';
import { EmergencyLine } from './emergency-line';
import { SearchRefineQuestion } from './search-follow-up';

type SeoResultsProps = {
  /** The `/v2/search` answer the server fetched for this URL. */
  data: V2Response;
  query: string;
  /** The same search with `refine=1`: the questions, client-side. */
  refineHref: string;
  /** The full results page for the same URL. */
  allResultsHref: string;
};

/**
 * Prototype (v2-search--seo-urls, Q4 = A): the plain search URL, with its first results already in
 * the HTML. A client component, so it is rendered into the HTML and then hydrated (the 911 chips and the question card need the client): names, organizations, a short text and a link for each hit, the
 * same for a bot and for a person. The questions come only with `refine=1`. The 911 and 988
 * chips are the same always-on line as on the other search pages.
 */
export function SeoResults({
  data,
  query,
  refineHref,
  allResultsHref,
}: SeoResultsProps) {
  const hits = seedHits(data);
  const total = seedTotal(data) || hits.length;

  return (
    <main
      className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6"
      data-testid="seo-results"
    >
      <div>
        <EmergencyLine />
        <form action="/find" method="get" role="search" className="flex gap-2">
          <label htmlFor="seo-query" className="sr-only">
            What do you need help with?
          </label>
          <input
            id="seo-query"
            name="query"
            type="search"
            defaultValue={query}
            className="border-control-border min-h-12 min-w-0 flex-1 rounded-lg border bg-white px-4 text-base"
          />
          <button
            type="submit"
            className="bg-primary text-primary-foreground min-h-12 rounded-lg px-4 font-semibold"
          >
            Search
          </button>
        </form>
      </div>
      <h1 className="text-xl font-semibold">
        {total === 0
          ? `No services found for “${query}”`
          : `${total} ${total === 1 ? 'service' : 'services'} for “${query}”`}
      </h1>
      <p className="text-sm">
        <Link
          href={refineHref}
          className="text-primary font-semibold underline"
          data-testid="seo-refine-link"
        >
          Answer a few questions to narrow these results
        </Link>
      </p>
      {/* Client-side: the next question and the emergency popup, from the same seeded answer. */}
      <SearchRefineQuestion />
      {hits.length > 0 && (
        <ol className="flex flex-col gap-3" data-testid="seo-result-list">
          {hits.map((hit) => (
            <li
              key={hit.id}
              className="rounded-lg border bg-white p-4 shadow-sm"
              data-search-result
            >
              <h2 className="text-lg font-semibold">
                <Link href={hit.href} className="text-primary underline">
                  {hit.name}
                </Link>
              </h2>
              {hit.organization && (
                <p className="text-muted-foreground text-sm">
                  {hit.organization}
                </p>
              )}
              {hit.text && <p className="mt-1 text-sm">{hit.text}</p>}
            </li>
          ))}
        </ol>
      )}
      {hits.length > 0 && (
        <p className="text-sm">
          <Link href={allResultsHref} className="text-primary underline">
            See all results, with filters and map
          </Link>
        </p>
      )}
    </main>
  );
}
