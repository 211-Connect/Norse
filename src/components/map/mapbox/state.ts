import { atom } from 'jotai';
import { LngLatLike, Map } from 'mapbox-gl';

export const mapAtom = atom<{
  map: Map;
  mapContainer: HTMLElement;
  bounds: LngLatLike[];
}>({
  map: null,
  mapContainer: null,
  bounds: [],
});
