export abstract class BaseMapAdapter {
  abstract forwardGeocode(
    address: string,
    options: { locale: string },
  ): Promise<
    {
      address: string;
      coordinates: [number, number];
    }[]
  >;

  abstract reverseGeocode(
    coordinates: string,
    options: { locale: string },
  ): Promise<
    {
      address: string;
      coordinates: [number, number];
    }[]
  >;
}
