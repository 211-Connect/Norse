export abstract class BaseGeocoderAdapter {
  abstract forwardGeocode(
    address: string,
    options: { locale: string },
  ): Promise<
    {
      type: 'coordinates' | 'invalid';
      address: string;
      coordinates: [number, number];
      country?: string;
      district?: string;
      place?: string;
      postcode?: string;
      region?: string;
    }[]
  >;

  abstract reverseGeocode(
    coordinates: string,
    options: { locale: string },
  ): Promise<
    {
      address: string;
      coordinates: [number, number];
      country?: string;
      district?: string;
      place?: string;
      postcode?: string;
      region?: string;
    }[]
  >;
}
