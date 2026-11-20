'use client';

import { useAtomValue } from 'jotai';
import { MapPin } from 'lucide-react';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { firstPlaceIndex, useLocations } from '../../hooks/api/use-locations';
import { useAppConfig } from '../../hooks/use-app-config';
import { useDebounce } from '../../hooks/use-debounce';
import { LOCATION_SEARCH_DEBOUNCE_DELAY } from '../../lib/constants';
import {
  clearLocationCookies,
  setLocationCookies,
} from '../../lib/location-cookies';
import {
  EVERYWHERE_LOCATION,
  isEverywhereLocation,
} from '../../lib/search-utils';
import { cn } from '../../lib/utils';
import {
  prevSearchLocationAtom,
  searchCoordinatesAtom,
  searchLocationAtom,
  searchLocationValidationErrorAtom,
  userCoordinatesAtom,
} from '../../store/search';
import { Autocomplete, FLOATING_LISTBOX_CLASSNAME } from '../ui/autocomplete';
import { MainSearchLayoutContext } from './main-search-layout/main-search-layout-context';
import { UseMyLocationButton } from './use-my-location-button';

type BaseProps = {
  className?: string;
  focusByDefault?: boolean;
  inputId?: string;
  showIcon?: boolean;
  placeholder?: string;
  /** Extra classes for the suggestion list. */
  listClassName?: string;
  /** Integrated mode: "Use my location" sits in the row, right of the input (v2 pages). */
  myLocationInline?: boolean;
  /**
   * Integrated mode: `form` (default) anchors the list to the search form; `input` anchors it to
   * the input (same left edge and width) and keeps it below the input, scrolling inside itself.
   */
  anchorList?: 'form' | 'input';
  /** Enter and Tab wait for the place lookup to finish, then commit the first match (v2 pages). */
  commitAfterLoad?: boolean;
  /** Integrated mode: "Everywhere" goes after the matches unless the text starts like it (v2 pages). */
  rankEverywhere?: boolean;
};

// Integrated mode - uses global atoms and context
type IntegratedModeProps = BaseProps & {
  mode?: 'integrated';
};

// Standalone mode - uses local state and callbacks
type StandaloneModeProps = BaseProps & {
  mode: 'standalone';
  /** `regionId`: the picked place's Region (state, county, city, ZIP), else null. */
  onLocationChange: (
    location: string,
    coordinates: number[] | null,
    regionId: string | null,
  ) => void;
  initialValue?: string;
};

type LocationSearchBarProps = IntegratedModeProps | StandaloneModeProps;

export function LocationSearchBar(props: LocationSearchBarProps) {
  const {
    className,
    focusByDefault = false,
    inputId,
    showIcon = true,
    placeholder,
    myLocationInline = false,
    anchorList = 'form',
    commitAfterLoad = false,
    rankEverywhere = false,
  } = props;
  const mode = props.mode || 'integrated';
  const isStandalone = mode === 'standalone';

  const appConfig = useAppConfig();
  const { t } = useTranslation('common');
  // True while the user is actively typing an uncommitted value — drives the
  // debounced geocode lookup. Set by Autocomplete's onInputChange (typing)
  // and cleared by onCommit/onDecommit-to-empty (a value settled).
  const [isTyping, setIsTyping] = useState(false);

  // Local state for standalone mode
  const [localSearchLocation, setLocalSearchLocation] = useState(
    isStandalone && 'initialValue' in props ? props.initialValue || '' : '',
  );
  const [localPrevSearchLocation, setLocalPrevSearchLocation] = useState('');

  useEffect(() => {
    if (!isStandalone || !('initialValue' in props)) {
      return;
    }

    const nextValue = props.initialValue || '';
    setLocalSearchLocation(nextValue);
    setLocalPrevSearchLocation(nextValue);
  }, [isStandalone, 'initialValue' in props ? props.initialValue : undefined]);

  // Global atoms for integrated mode
  const globalSearchLocation = useAtomValue(searchLocationAtom);
  const globalCoords = useAtomValue(searchCoordinatesAtom);
  const globalPrevSearchLocation = useAtomValue(prevSearchLocationAtom);
  const userCoordinates = useAtomValue(userCoordinatesAtom);

  // Select state based on mode
  const searchLocation = isStandalone
    ? localSearchLocation
    : globalSearchLocation;
  const prevSearchLocation = isStandalone
    ? localPrevSearchLocation
    : globalPrevSearchLocation;
  // "Everywhere" is an option of its own, not a place: never geocode it
  // (that would suggest e.g. "Everywhere Street, Houston").
  const everywhereLabel = t('search.everywhere', 'Everywhere');
  const isEverywhere = useCallback(
    (value: string) =>
      isEverywhereLocation(value) ||
      value.trim().toLowerCase() === everywhereLabel.toLowerCase(),
    [everywhereLabel],
  );
  const rawLocationQuery = isStandalone ? searchLocation : prevSearchLocation;
  const locationQuery = isEverywhere(rawLocationQuery) ? '' : rawLocationQuery;
  const debouncedSearchLocation = useDebounce(
    locationQuery,
    LOCATION_SEARCH_DEBOUNCE_DELAY,
  );
  const {
    data: locations,
    options,
    additionalLocations,
    isFetching,
    everywhereIsFirst,
  } = useLocations(
    isTyping
      ? debouncedSearchLocation
      : isEverywhere(prevSearchLocation)
        ? ''
        : prevSearchLocation,
    isStandalone, // Exclude additional locations in standalone mode
    { rankEverywhere: rankEverywhere && !isStandalone },
  );

  // While actively searching and awaiting API results, suppress stale geocoded
  // suggestions so Enter/Tab can never commit a stale location. This must
  // also cover the debounce window itself, not just the network fetch: for
  // up to LOCATION_SEARCH_DEBOUNCE_DELAY after a keystroke, `options` still
  // reflects the *previous* debounced query (locationQuery hasn't reached
  // debouncedSearchLocation yet), so `isFetching` alone would stay false and
  // let a stale/irrelevant option through.
  const isPendingResults =
    isTyping && (locationQuery !== debouncedSearchLocation || isFetching);
  const displayOptions = useMemo(
    () =>
      isPendingResults
        ? options.filter((opt) =>
            additionalLocations.some((loc) => loc.address === opt.value),
          )
        : options,
    [isPendingResults, options, additionalLocations],
  );
  const validationError = useAtomValue(searchLocationValidationErrorAtom);

  // In standalone mode "Everywhere" is excluded from options (see
  // useLocations' excludeEverywhere), so the first result is already at
  // index 0. In integrated mode "Everywhere" always occupies index 0, so
  // the first real result is at index 1. Standalone mode also has no
  // meaningful "already has coordinates" state of its own to suppress
  // auto-select with, so it always defaults to index 0.
  //
  // A committed "Everywhere" is a valid value, so nothing replaces it.
  const autoSelectIndex =
    !isTyping && isEverywhere(searchLocation)
      ? undefined
      : isStandalone
        ? 0
        : globalCoords?.length === 2
          ? undefined
          : rankEverywhere
            ? firstPlaceIndex(everywhereIsFirst)
            : 1;

  // Use context only if available (for main search integration)
  const context = useContext(MainSearchLayoutContext);
  const setSearch = context?.setSearch;

  const findCoords = useCallback(
    (value: string) => {
      const location = locations.find(
        (loc) => loc.address.toLowerCase() === value.toLowerCase(),
      );

      if (location) return location;

      const additionalLocation = additionalLocations.find(
        (loc) => loc.address.toLowerCase() === value.toLowerCase(),
      );

      if (additionalLocation) return additionalLocation;

      return {
        type: 'invalid' as const,
        address: value,
        coordinates: [0, 0] as [number, number],
        place_type: [],
        bbox: undefined,
      };
    },
    [locations, additionalLocations],
  );

  // Called only when Autocomplete commits a value (click, Enter, Tab,
  // Escape-with-highlight, blur-autoselect) — never on raw typing.
  const handleCommit = useCallback(
    (value) => {
      const coords = findCoords(value);

      // Only persist a location preference when we have confirmed coordinates.
      // Invalid/unrecognised values wipe the stored preference so stale data
      // is never carried forward into the next search.
      if (coords.type === 'coordinates') {
        setLocationCookies(value, coords);
      } else {
        clearLocationCookies();
      }

      setIsTyping(false);

      if (isStandalone && 'onLocationChange' in props) {
        setLocalSearchLocation(value);
        props.onLocationChange(
          value,
          coords.type === 'invalid' ? null : (coords.coordinates ?? null),
          coords.type === 'coordinates' ? (coords.region_id ?? null) : null,
        );
      } else {
        setSearch?.((prev) => {
          // Ensure we are only providing updated coordinates to prevent unnecessary rerenders
          const coordinates = coords.coordinates;
          const isNewCoords =
            coords.type === 'invalid' ||
            (coordinates?.[0] !== userCoordinates?.[0] &&
              coordinates?.[1] !== userCoordinates?.[1]);

          return {
            ...prev,
            ...(isNewCoords
              ? {
                  searchCoordinates:
                    coords.type === 'invalid' ? [] : (coordinates ?? []),
                }
              : {}),
            // The state holds the sentinel, not the translated label, so URL
            // writers can recognise "no location" in every locale.
            searchLocation: isEverywhere(value) ? EVERYWHERE_LOCATION : value,
            searchLocationValidationError: '',
            // An area (state, county, city, ZIP) is searched as its shape;
            // an address or a place with no Region yet as a point and radius.
            searchRegion:
              coords.type === 'coordinates' ? (coords.region_id ?? '') : '',
          };
        });
      }
    },
    [findCoords, isEverywhere, setSearch, isStandalone, props, userCoordinates],
  );

  // Called on every keystroke (Autocomplete's onInputChange) — purely a live
  // echo that feeds the debounced geocode lookup. Never touches cookies or
  // the committed searchLocation/searchCoordinates; see handleCommit for that.
  const handleInputChange = useCallback(
    (value: string) => {
      setIsTyping(true);

      if (isStandalone) {
        setLocalSearchLocation(value);
        setLocalPrevSearchLocation(value);
      } else {
        setSearch?.((prev) => ({
          ...prev,
          prevSearchLocation: value,
        }));
      }
    },
    [setSearch, isStandalone],
  );

  const handleClear = useCallback(() => {
    handleCommit(everywhereLabel);
    if (isStandalone) {
      setLocalPrevSearchLocation('');
    } else {
      setSearch?.((prev) => ({ ...prev, prevSearchLocation: '' }));
    }
  }, [isStandalone, setSearch, handleCommit, everywhereLabel]);

  // Called by Autocomplete when the committed block is burst-cleared by a
  // keypress. `nextValue` is the triggering character, or '' for Backspace/Delete.
  // Unlike handleClear, this does NOT route through "Everywhere" — it leaves
  // the field open for an entirely new address search.
  const handleDecommit = useCallback(
    (nextValue: string) => {
      clearLocationCookies();
      setIsTyping(nextValue.length > 0);

      if (isStandalone && 'onLocationChange' in props) {
        setLocalSearchLocation(nextValue);
        setLocalPrevSearchLocation(nextValue);
      } else {
        setSearch?.((prev) => ({
          ...prev,
          searchCoordinates: [],
          searchLocation: nextValue,
          prevSearchLocation: nextValue,
          searchLocationValidationError: '',
          searchRegion: '',
        }));
      }
    },
    [isStandalone, props, setSearch],
  );

  const inline = !isStandalone && myLocationInline;
  const anchorToInput = !isStandalone && anchorList === 'input';

  return (
    <div
      className={cn(
        'location-box',
        inline ? 'flex flex-row flex-wrap items-start gap-2' : 'flex flex-col',
        !inline && (isStandalone ? 'gap-2' : 'gap-4'),
      )}
    >
      <Autocomplete
        className={cn(
          className,
          !isStandalone && 'search-box',
          inline && 'min-w-0 flex-1',
        )}
        wrapperTestId="location-field"
        readerLabel={t('search.location_input_label')}
        inputProps={{
          autoFocus: focusByDefault,
          id: inputId,
          className: cn(
            isStandalone &&
              (showIcon
                ? 'h-9 rounded-md px-3 pl-9 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
                : 'h-9 rounded-md px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'),
            validationError ? '!border-red-500' : undefined,
          ),
          placeholder:
            placeholder ??
            appConfig.search.texts?.locationInputPlaceholder ??
            t('search.location_placeholder'),
        }}
        defaultOpen={focusByDefault}
        options={displayOptions}
        Icon={showIcon ? MapPin : () => null}
        onInputChange={handleInputChange}
        onCommit={handleCommit}
        onClear={handleClear}
        blockMode
        onDecommit={handleDecommit}
        onEscape={handleClear}
        value={
          isEverywhereLocation(searchLocation)
            ? everywhereLabel
            : searchLocation
        }
        clearButtonLabel={t('call_to_action.remove')}
        autoSelectIndex={autoSelectIndex}
        autoSelectOnBlurIndex={autoSelectIndex}
        loading={isPendingResults}
        // Standalone fields live in dialogs, where the list floats over the
        // dialog's other content.
        listboxClassName={cn(
          isStandalone ? FLOATING_LISTBOX_CLASSNAME : undefined,
          props.listClassName,
        )}
        positionBelowElementId={
          isStandalone || anchorToInput ? undefined : 'search-form-inputs'
        }
        placement={anchorToInput ? 'below' : 'auto'}
        waitForOptions={commitAfterLoad}
      />
      {validationError && (
        <p
          className={cn(
            'min-h-4 px-3 text-xs text-red-500',
            inline && 'order-last basis-full',
          )}
        >
          {validationError}
        </p>
      )}
      {inline && (
        <div className="shrink-0">
          <UseMyLocationButton className="min-h-11 whitespace-nowrap" />
        </div>
      )}
      {!isStandalone && !inline && (
        <div>
          <UseMyLocationButton />
        </div>
      )}
    </div>
  );
}
