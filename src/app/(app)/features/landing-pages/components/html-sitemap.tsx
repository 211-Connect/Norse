import Link from 'next/link';

import type { SitemapLink, SitemapTopic } from '../lib/htmlSitemap';

type Href = (path: string) => string;

const linkClass = 'text-primary underline-offset-2 hover:underline';

function PageLink({
  href,
  label,
  path,
}: {
  href: Href;
  label: string;
  path?: string;
}) {
  return path ? (
    <Link href={href(path)} className={linkClass}>
      {label}
    </Link>
  ) : (
    <span>{label}</span>
  );
}

function Cities({ cities, href }: { cities: SitemapLink[]; href: Href }) {
  if (cities.length === 0) return null;
  return (
    <ul className="mt-1 ml-4 flex flex-col gap-1 border-l pl-3">
      {cities.map((city) => (
        <li key={city.path}>
          <PageLink href={href} label={city.label} path={city.path} />
        </li>
      ))}
    </ul>
  );
}

/** One topic's pages: each state, its counties A–Z, their cities indented. */
export function SitemapTopicTree({
  topic,
  href,
}: {
  topic: SitemapTopic;
  href: Href;
}) {
  return (
    <div className="flex flex-col gap-4">
      {topic.states.map((state) => (
        <section key={state.label} className="flex flex-col gap-2">
          <h3 className="font-semibold">
            <PageLink href={href} label={state.label} path={state.path} />
          </h3>
          <ul className="flex flex-col gap-1.5 text-sm">
            {state.counties.map((county, index) =>
              county.label ? (
                <li key={county.path ?? county.label}>
                  <PageLink
                    href={href}
                    label={county.label}
                    path={county.path}
                  />
                  <Cities cities={county.cities} href={href} />
                </li>
              ) : (
                // Cities whose county has no page.
                <li key={`cities-${index}`}>
                  <Cities cities={county.cities} href={href} />
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * Every topic in a collapsible section. Collapsed sections stay in the
 * HTML, so crawlers see every link.
 */
export function HtmlSitemap({
  topics,
  href,
}: {
  topics: SitemapTopic[];
  href: Href;
}) {
  return (
    <div className="flex flex-col gap-3">
      {topics.map((topic) => (
        <details
          key={topic.id}
          id={topic.slug}
          className="bg-background rounded-lg border p-4"
        >
          <summary className="cursor-pointer text-lg font-semibold">
            <h2 className="inline">{topic.name}</h2>
          </summary>
          <div className="mt-4">
            <SitemapTopicTree topic={topic} href={href} />
          </div>
        </details>
      ))}
    </div>
  );
}

/** `/sitemap` past the link limit: one link per topic page. */
export function SitemapTopicList({
  topics,
  href,
}: {
  topics: SitemapTopic[];
  href: Href;
}) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {topics.map((topic) => (
        <li key={topic.id}>
          <Link href={href(`sitemap/${topic.slug}`)} className={linkClass}>
            {topic.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
