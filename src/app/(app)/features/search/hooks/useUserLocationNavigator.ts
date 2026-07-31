import {
  userCoordinatesAtom,
  searchCoordinatesAtom,
} from '@/app/(app)/shared/store/search';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { isValidCoordinate } from '@/utils/isValidCoordinate';

type Args = {
  isDialogOpen: boolean;
};

export const useUserLocationNavigator = ({ isDialogOpen }: Args) => {
  const setUserCoordinates = useSetAtom(userCoordinatesAtom);
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);
  const hasSearchLocation = isValidCoordinate(searchCoordinates);

  useEffect(() => {
    if (hasSearchLocation) {
      setUserCoordinates(searchCoordinates);
    }
  }, [hasSearchLocation, searchCoordinates, setUserCoordinates]);

  useEffect(() => {
    if (hasSearchLocation || !isDialogOpen || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoordinates([pos.coords.longitude, pos.coords.latitude]);
      },
      () => {
        setUserCoordinates([]);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 },
    );
  }, [hasSearchLocation, isDialogOpen, setUserCoordinates]);
};
