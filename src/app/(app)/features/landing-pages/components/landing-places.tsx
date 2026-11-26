import Link from 'next/link';

import type { LandingAreaGroup } from '../server/landing-page-data';

/**
 * "Search for services in other regions": links to the topic's pages for
 * the areas below and beside this one (docs/landing-pages.md, "The page").
 * Shown with or without results.
 */
export function LandingPlaces({
  heading,
  groups,
}: {
  heading: string;
  groups: LandingAreaGroup[];
}) {
  if (groups.length === 0) return null;
  return (
    <nav
      aria-label={heading}
      className="bg-background flex flex-col gap-4 rounded-md border p-4 print:hidden"
    >
      <h2 className="text-base font-semibold">{heading}</h2>
      {groups.map((group) => (
        <section key={group.heading} className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-sm font-medium">
            {group.heading}
          </h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {group.links.map((place) => (
              <li key={place.href}>
                <Link
                  href={place.href}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {place.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
