import { userCoordinatesAtom } from '@/app/(app)/shared/store/search';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

type Args = {
  isDialogOpen: boolean;
};

export const useUserLocationNavigator = ({ isDialogOpen }: Args) => {
  const setUserCoordinates = useSetAtom(userCoordinatesAtom);

  useEffect(() => {
    if (!isDialogOpen || !navigator.geolocation) {
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
  }, [isDialogOpen, setUserCoordinates]);
};
