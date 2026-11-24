import Link from 'next/link';

import type { LandingChildLink } from '../server/landing-page-data';

/** A state page's counties, or a county page's cities: their landing pages. */
export function LandingPlaces({
  heading,
  places,
}: {
  heading: string;
  places: LandingChildLink[];
}) {
  if (places.length === 0) return null;
  return (
    <nav aria-label={heading} className="flex flex-col gap-2 px-1 print:hidden">
      <h2 className="text-sm font-semibold">{heading}</h2>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {places.map((place) => (
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
    </nav>
  );
}
