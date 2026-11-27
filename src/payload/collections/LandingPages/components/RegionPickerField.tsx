'use client';

import { Button, useField, useFormFields } from '@payloadcms/ui';
import { useEffect, useMemo, useState } from 'react';

import {
  type CatalogRegion,
  type StoredRegion,
  buildRegionTree,
  newPlaces,
  selectedIds,
  selectedStates,
  stateEntry,
  withStateSelection,
  withoutState,
} from '@/app/(app)/features/landing-pages/lib/regionSelection';
import { STATE_NAMES } from '@/app/(app)/features/landing-pages/lib/slugs';

import './RegionPickerField.css';

type Props = { path: string };

const useTenantId = () => {
  const value = useFormFields(([fields]) => fields.tenant?.value);
  if (value && typeof value === 'object' && 'id' in value) {
    return String((value as { id: unknown }).id);
  }
  return value ? String(value) : null;
};

const matches = (region: CatalogRegion, search: string) =>
  region.name.toLowerCase().includes(search);

function StatePanel({
  state,
  tenantId,
  selection,
  onChange,
}: {
  state: string;
  tenantId: string;
  selection: StoredRegion[];
  onChange: (next: StoredRegion[]) => void;
}) {
  const [items, setItems] = useState<CatalogRegion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [onlyNew, setOnlyNew] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    fetch(
      `/api/landing-pages/admin/regions?tenantId=${encodeURIComponent(tenantId)}&state=${state}`,
      { credentials: 'include' },
    )
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(body.message ?? `HTTP ${response.status}`);
        if (!cancelled) setItems(body.items as CatalogRegion[]);
      })
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [state, tenantId]);

  const ids = useMemo(() => selectedIds(selection, state), [selection, state]);
  const tree = useMemo(() => buildRegionTree(items ?? []), [items]);
  const fresh = useMemo(
    () => new Set(newPlaces(selection, state, items ?? []).map((r) => r.id)),
    [selection, state, items],
  );

  if (error) {
    return <p className="region-picker__error">{error}</p>;
  }
  if (!items) {
    return <p className="region-picker__muted">Loading counties and cities…</p>;
  }

  const counties = tree.counties.map((n) => n.county);
  const cities = [
    ...tree.counties.flatMap((n) => n.cities),
    ...tree.otherCities,
  ];
  const update = (next: Set<string>) =>
    onChange(withStateSelection(selection, state, next, items));
  const toggle = (id: string) => {
    const next = new Set(ids);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    update(next);
  };
  const setMany = (regions: CatalogRegion[], on: boolean) => {
    const next = new Set(ids);
    for (const r of regions) {
      if (on) next.add(r.id);
      else next.delete(r.id);
    }
    update(next);
  };

  const query = search.trim().toLowerCase();
  const cityVisible = (city: CatalogRegion) =>
    (!onlyNew || fresh.has(city.id)) && (!query || matches(city, query));
  const groups = [
    ...tree.counties.map((n) => ({ county: n.county, cities: n.cities })),
    ...(tree.otherCities.length
      ? [{ county: null as CatalogRegion | null, cities: tree.otherCities }]
      : []),
  ]
    .map((group) => {
      const countyHit =
        !onlyNew && (!query || (group.county && matches(group.county, query)));
      const shownCities = group.cities.filter(cityVisible);
      return { ...group, countyHit, shownCities };
    })
    .filter((g) => g.countyHit || g.shownCities.length > 0);
  const filtering = Boolean(query) || onlyNew;

  const countOf = (list: CatalogRegion[]) =>
    list.filter((r) => ids.has(r.id)).length;

  return (
    <div className="region-picker__state-body">
      <div className="region-picker__toolbar">
        <input
          type="search"
          className="region-picker__search"
          placeholder="Search counties and cities"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={`Search ${STATE_NAMES[state] ?? state} counties and cities`}
        />
        <span className="region-picker__counts">
          {countOf(counties)}/{counties.length} counties · {countOf(cities)}/
          {cities.length} cities
        </span>
        {fresh.size > 0 && (
          <button
            type="button"
            className="region-picker__chip"
            aria-pressed={onlyNew}
            onClick={() => setOnlyNew(!onlyNew)}
          >
            {fresh.size} new {fresh.size === 1 ? 'city' : 'cities'} available
          </button>
        )}
      </div>
      <div className="region-picker__actions">
        <Button
          buttonStyle="secondary"
          size="small"
          onClick={() => setMany(counties, true)}
        >
          Select all counties
        </Button>
        <Button
          buttonStyle="secondary"
          size="small"
          onClick={() => setMany(cities, true)}
        >
          Select all cities
        </Button>
        <Button
          buttonStyle="secondary"
          size="small"
          onClick={() => setMany([...counties, ...cities], false)}
        >
          Clear
        </Button>
      </div>

      <ul className="region-picker__tree">
        {groups.map(({ county, cities: all, countyHit, shownCities }) => {
          const key = county?.id ?? 'other';
          const open = filtering || expanded.has(key);
          const list = filtering ? shownCities : all;
          return (
            <li key={key} className="region-picker__county">
              <div className="region-picker__row">
                <button
                  type="button"
                  className="region-picker__expand"
                  aria-expanded={open}
                  aria-label={`${open ? 'Collapse' : 'Expand'} ${county?.name ?? 'other cities'}`}
                  disabled={all.length === 0}
                  onClick={() =>
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      return next;
                    })
                  }
                >
                  {all.length === 0 ? '' : open ? '▾' : '▸'}
                </button>
                {county ? (
                  <label
                    className="region-picker__label"
                    data-dim={!countyHit || undefined}
                  >
                    <input
                      type="checkbox"
                      checked={ids.has(county.id)}
                      onChange={() => toggle(county.id)}
                    />
                    {county.name.replace(/,\s*[A-Z]{2}$/, '')}
                  </label>
                ) : (
                  <span className="region-picker__label">
                    Cities outside any county
                  </span>
                )}
                {all.length > 0 && (
                  <span className="region-picker__sub">
                    {countOf(all)}/{all.length}{' '}
                    {all.length === 1 ? 'city' : 'cities'}
                    {open && list.length > 0 && (
                      <>
                        {' · '}
                        {/* While searching, acts on the cities shown only. */}
                        <button
                          type="button"
                          className="region-picker__link"
                          onClick={() =>
                            setMany(list, countOf(list) < list.length)
                          }
                        >
                          {countOf(list) < list.length
                            ? filtering
                              ? 'tick shown'
                              : 'all'
                            : 'none'}
                        </button>
                      </>
                    )}
                  </span>
                )}
              </div>
              {open && list.length > 0 && (
                <ul className="region-picker__cities">
                  {list.map((city) => (
                    <li key={city.id}>
                      <label className="region-picker__label">
                        <input
                          type="checkbox"
                          checked={ids.has(city.id)}
                          onChange={() => toggle(city.id)}
                        />
                        {city.name}
                        {fresh.has(city.id) && (
                          <span className="region-picker__new">new</span>
                        )}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
        {groups.length === 0 && (
          <li className="region-picker__muted">Nothing matches.</li>
        )}
      </ul>
    </div>
  );
}

/**
 * The Landing Pages tab's region picker (docs/landing-pages.md, Regions):
 * states, then a county › city checkbox tree from Norse-API. Saves an
 * explicit list of regions; a selected state always gets its state pages.
 */
const RegionPickerField = ({ path }: Props) => {
  const { value, setValue } = useField<StoredRegion[] | null>({ path });
  const tenantId = useTenantId();
  const selection = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const states = selectedStates(selection);
  const [adding, setAdding] = useState('');

  if (!tenantId) return null;

  return (
    <section className="region-picker">
      <h3 className="region-picker__title">Regions</h3>
      <p className="region-picker__muted">
        Every selected state gets a page per topic; tick the counties and cities
        that should have their own. Changes take effect on Apply changes.
      </p>

      {states.map((state) => (
        <details key={state} className="region-picker__state" open>
          <summary>
            <span className="region-picker__state-name">
              {STATE_NAMES[state] ?? state}
            </span>
            <span className="region-picker__muted">
              {' '}
              state page always on · {selectedIds(selection, state).size}{' '}
              counties and cities selected
            </span>
            <button
              type="button"
              className="region-picker__link region-picker__remove"
              onClick={(e) => {
                e.preventDefault();
                if (
                  window.confirm(
                    `Remove ${STATE_NAMES[state] ?? state} and all its counties and cities? Their pages retire and redirect on Apply changes.`,
                  )
                ) {
                  setValue(withoutState(selection, state));
                }
              }}
            >
              Remove state
            </button>
          </summary>
          <StatePanel
            state={state}
            tenantId={tenantId}
            selection={selection}
            onChange={setValue}
          />
        </details>
      ))}

      <div className="region-picker__add">
        <select
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          aria-label="State to add"
        >
          <option value="">Add a state…</option>
          {Object.entries(STATE_NAMES)
            .filter(([code]) => !states.includes(code))
            .map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
        </select>
        <Button
          size="small"
          disabled={!adding}
          onClick={() => {
            setValue([...selection, stateEntry(adding)]);
            setAdding('');
          }}
        >
          Add state
        </Button>
      </div>
    </section>
  );
};

export default RegionPickerField;
