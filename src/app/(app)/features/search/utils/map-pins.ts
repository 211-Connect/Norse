/** Matches `SEARCH_PINS_LIMIT` in Norse-API. */
export const MAP_PINS_LIMIT = 10_000;

export type SearchPin = {
  /** The list hit's `_id`, which is also its card's DOM id. */
  id: string;
  /** Resource page id. */
  resourceId: string | null;
  name: string | null;
  address: string;
  coordinates?: [number, number];
};

/** Where one or more resources share a building: they get one circle. */
export type PinSite = SearchPin[];

export const lastPageWithinPinLimit = (limit: number) =>
  Math.max(Math.ceil(MAP_PINS_LIMIT / limit), 1);

/** The results the map draws as circles: everything the list isn't showing as a pin. */
export const omitPagePins = (
  pins: SearchPin[],
  pagePins: SearchPin[],
): SearchPin[] => {
  const onPage = new Set(pagePins.map((pin) => pin.id));

  return pins.filter((pin) => !onPage.has(pin.id));
};

export const groupPinsBySite = (pins: SearchPin[]): PinSite[] => {
  const sites = new Map<string, PinSite>();

  for (const pin of pins) {
    const key =
      pin.coordinates?.map((value) => value.toFixed(5)).join() ?? pin.id;
    const site = sites.get(key);

    if (site) site.push(pin);
    else sites.set(key, [pin]);
  }

  return [...sites.values()];
};
