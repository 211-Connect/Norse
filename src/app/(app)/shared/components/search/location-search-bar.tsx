'use client';

import { MapPin } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import {
  clearLocationCookies,
  setLocationCookies,
} from '../../lib/location-cookies';

import {
  prevSearchLocationAtom,
  searchCoordinatesAtom,
  searchLocationAtom,
  searchLocationValidationErrorAtom,
} from '../../store/search';
import { useDebounce } from '../../hooks/use-debounce';
import { useLocations } from '../../hooks/api/use-locations';
import { useCallback, useContext, useState } from 'react';
import { cn } from '../../lib/utils';
import { Autocomplete } from '../ui/autocomplete';
import { DistanceSelect } from './distance-select';
import { UseMyLocationButton } from './use-my-location-button';
import { useAppConfig } from '../../hooks/use-app-config';
import { MainSearchLayoutContext } from './main-search-layout/main-search-layout-context';

type BaseProps = {
  className?: string;
  focusByDefault?: boolean;
  inputId?: string;
  enterKeyFocusTargetId?: string;
};

// Integrated mode - uses global atoms and context
type IntegratedModeProps = BaseProps & {
  mode?: 'integrated';
};

// Standalone mode - uses local state and callbacks
type StandaloneModeProps = BaseProps & {
  mode: 'standalone';
  onLocationChange: (location: string, coordinates: number[] | null) => void;
  initialValue?: string;
};

type LocationSearchBarProps = IntegratedModeProps | StandaloneModeProps;

export function LocationSearchBar(props: LocationSearchBarProps) {
  const {
    className,
    focusByDefault = false,
    inputId,
    enterKeyFocusTargetId,
  } = props;
  const mode = props.mode || 'integrated';
  const isStandalone = mode === 'standalone';

  const appConfig = useAppConfig();
  const { t } = useTranslation('common');
  const [shouldSearch, setShouldSearch] = useState(false);

  // Local state for standalone mode
  const [localSearchLocation, setLocalSearchLocation] = useState(
    isStandalone && 'initialValue' in props ? props.initialValue || '' : '',
  );
  const [localPrevSearchLocation, setLocalPrevSearchLocation] = useState('');

  // Global atoms for integrated mode
  const globalSearchLocation = useAtomValue(searchLocationAtom);
  const coords = useAtomValue(searchCoordinatesAtom);
  const globalPrevSearchLocation = useAtomValue(prevSearchLocationAtom);

  // Select state based on mode
  const searchLocation = isStandalone
    ? localSearchLocation
    : globalSearchLocation;
  const prevSearchLocation = isStandalone
    ? localPrevSearchLocation
    : globalPrevSearchLocation;
  const debouncedSearchLocation = useDebounce(searchLocation, 1000);
  const {
    data: locations,
    options,
    additionalLocations,
  } = useLocations(
    shouldSearch ? debouncedSearchLocation : prevSearchLocation,
    isStandalone, // Exclude additional locations in standalone mode
  );
  const validationError = useAtomValue(searchLocationValidationErrorAtom);

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

  const setSearchLocation = useCallback(
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

      setShouldSearch(false);

      if (isStandalone && 'onLocationChange' in props) {
        setLocalSearchLocation(value);
        props.onLocationChange(
          value,
          coords.type === 'invalid' ? null : (coords.coordinates ?? null),
        );
      } else {
        setSearch?.((prev) => {
          // Ensure we are only providing updated coordinates to prevent unnecessary rerenders
          let isNewCoords = false;
          const coordinates = coords.coordinates;
          if (
            coords.type === 'invalid' ||
            (coords.type === 'coordinates' &&
              coordinates?.[0] !== prev['userCoordinates']?.[0] &&
              coordinates?.[1] !== prev['userCoordinates']?.[1]) ||
            (coordinates?.[0] !== prev['userCoordinates']?.[0] &&
              coordinates?.[1] !== prev['userCoordinates']?.[1])
          ) {
            isNewCoords = true;
          }

          return {
            ...prev,
            ...(isNewCoords
              ? {
                  searchCoordinates:
                    coords.type === 'invalid' ? [] : (coordinates ?? []),
                }
              : {}),
            searchLocation: value,
            searchLocationValidationError: '',
            // Capture place metadata for advanced geospatial filtering
            searchPlaceType: coords.place_type ?? [],
            searchBbox: coords.bbox ?? null,
          };
        });
      }
    },
    [findCoords, setSearch, isStandalone, props],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setShouldSearch(true);

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
    setSearchLocation(t('search.everywhere', 'Everywhere'));
    if (isStandalone) {
      setLocalPrevSearchLocation('');
    } else {
      setSearch?.((prev) => ({ ...prev, prevSearchLocation: '' }));
    }
  }, [isStandalone, setSearch, setSearchLocation, t]);

  return (
    <div className="location-box flex flex-col gap-4">
      <Autocomplete
        className={cn(className, 'search-box')}
        readerLabel={t('search.location_input_label')}
        inputProps={{
          autoFocus: focusByDefault,
          id: inputId,
          className: validationError ? '!border-red-500' : undefined,
          placeholder:
            appConfig.search.texts?.locationInputPlaceholder ||
            t('search.location_placeholder'),
        }}
        defaultOpen={focusByDefault}
        options={options}
        Icon={MapPin}
        onInputChange={handleInputChange}
        onValueChange={setSearchLocation}
        onClear={handleClear}
        value={searchLocation}
        clearButtonLabel={t('call_to_action.remove')}
        autoSelectIndex={coords?.length === 2 ? undefined : 1}
        autoSelectOnBlurIndex={1}
        enterKeyBehavior={
          isStandalone && enterKeyFocusTargetId ? 'focus-target' : 'submit-form'
        }
        enterKeyFocusTargetId={isStandalone ? enterKeyFocusTargetId : undefined}
        positionBelowElementId={isStandalone ? undefined : 'search-form-inputs'}
      />
      {validationError && (
        <p className="min-h-4 px-3 text-xs text-red-500">{validationError}</p>
      )}
      {!isStandalone && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <UseMyLocationButton />
          <DistanceSelect className="ml-auto" />
        </div>
      )}
    </div>
  );
}
