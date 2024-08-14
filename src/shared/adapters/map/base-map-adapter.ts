export abstract class BaseMapAdapter {
  abstract forwardGeocode(): Promise<null>;

  abstract reverseGeocode(): Promise<null>;
}
