export const getGeolocation = (): Promise<
  { data: GeolocationPosition; error: null } | { data: null; error: string }
> =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        data: null,
        error: 'Geolocation is not supported by your browser',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ data: position, error: null });
      },
      (error) => {
        resolve({ data: null, error: error.message });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    );
  });
