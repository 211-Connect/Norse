import {
  userCoordinatesAtom,
  searchCoordinatesAtom,
} from '@/app/(app)/shared/store/search';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

type Args = {
  isDialogOpen: boolean;
};

export const useUserLocationNavigator = ({ isDialogOpen }: Args) => {
  const setUserCoordinates = useSetAtom(userCoordinatesAtom);
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);

  useEffect(() => {
    if (!isDialogOpen || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoordinates([pos.coords.longitude, pos.coords.latitude]);
      },
      () => {
        setUserCoordinates(searchCoordinates);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 },
    );
  }, [isDialogOpen, setUserCoordinates, searchCoordinates]);
};
