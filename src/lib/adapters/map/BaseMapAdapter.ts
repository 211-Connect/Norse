export abstract class BaseMapAdapter {
  abstract search(query: string, locale: string, sessionId: string);

  abstract retrieve(mapboxId: string, locale: string, sessionId: string);

  abstract reverseGeocode(coords: string, locale: string);

  abstract forwardGeocode(address: string, locale: string);
}
