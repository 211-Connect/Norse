/**
 * The areas around a landing page, from the topic's live pages in its state
 * and the topic's other state pages (docs/landing-pages.md, "The page").
 * Pure.
 */
import type { LandingLink, LandingRegion } from './types';

export type LandingAreas = {
  /** State page, then county page, when they exist. */
  parents: LandingLink[];
  /** State → its counties (its cities when it has no county pages); county → its cities. */
  children: LandingLink[];
  /** The same level: other states; other counties of the state; other cities of the county (of the state when the city has no county). */
  siblings: LandingLink[];
};

const byName = (a: LandingLink, b: LandingLink) =>
  a.region.name.localeCompare(b.region.name);

/**
 * `nearby`: the topic's live pages in the page's state plus its live state
 * pages elsewhere, the page itself included or not.
 */
export function landingAreas(
  region: LandingRegion,
  nearby: readonly LandingLink[],
): LandingAreas {
  const others = nearby.filter((link) => link.region.id !== region.id);
  const inState = (link: LandingLink) => link.region.state === region.state;
  const of = (type: LandingRegion['type']) =>
    others.filter((link) => link.region.type === type);

  const state = of('state').find(inState);
  const county = region.countyId
    ? of('county').find((link) => link.region.id === region.countyId)
    : undefined;
  const parents =
    region.type === 'state'
      ? []
      : [state, county].filter((l) => l !== undefined);

  const counties = of('county').filter(inState);
  const children =
    region.type === 'state'
      ? counties.length
        ? counties
        : of('place').filter(inState)
      : region.type === 'county'
        ? of('place').filter((link) => link.region.countyId === region.id)
        : [];
  const siblings =
    region.type === 'state'
      ? of('state').filter((link) => !inState(link))
      : region.type === 'county'
        ? counties
        : of('place').filter((link) =>
            region.countyId
              ? link.region.countyId === region.countyId
              : inState(link) && !link.region.countyId,
          );
  return {
    parents,
    children: [...children].sort(byName),
    siblings: [...siblings].sort(byName),
  };
}
