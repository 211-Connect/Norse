import {
  Marker as MapboxMarker,
  PointLike,
  Alignment,
  LngLatLike,
  Popup,
} from 'mapbox-gl';
import { ReactElement, memo, useEffect } from 'react';
import { useAtom } from 'jotai';
import { mapAtom } from '../state';
import { renderToStaticMarkup } from 'react-dom/server';

export const Marker = memo(function MemoizedMarker({
  anchor,
  clickTolerance,
  color,
  draggable,
  pitchAlignment,
  rotation,
  rotationAlignment,
  scale,
  offset,
  element,
  latitude,
  longitude,
  className,
  onClick,
  popup,
}: {
  anchor?:
    | 'center'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';
  clickTolerance?: number;
  color?: string;
  draggable?: boolean;
  element?: HTMLElement;
  offset?: PointLike;
  pitchAlignment?: Alignment;
  rotation?: number;
  rotationAlignment?: 'viewport' | 'auto';
  scale?: number;
  latitude?: number;
  longitude?: number;
  className?: string;
  onClick?: (e: MouseEvent, marker: MapboxMarker) => void;
  popup?: ReactElement;
}) {
  const [state, setState] = useAtom(mapAtom);

  useEffect(() => {
    if (!state.map || !state.mapContainer) return;

    let marker;
    try {
      const lngLat: LngLatLike = [longitude, latitude];
      marker = new MapboxMarker(null, {
        anchor,
        clickTolerance,
        color,
        draggable,
        pitchAlignment,
        rotation,
        rotationAlignment,
        scale,
        offset,
        element,
      })
        .setLngLat(lngLat)
        .addTo(state.map);

      if (popup) {
        marker.setPopup(
          new Popup({ maxWidth: '320px' }).setHTML(renderToStaticMarkup(popup)),
        );
      }

      marker.getElement().classList.add(className);
      const clickListener = (e) => {
        return onClick?.(e, marker);
      };
      marker.getElement().addEventListener('click', clickListener);

      setState((prev) => {
        const newSet = [...prev.bounds];
        const idx = newSet.findIndex(
          (el) => el[0] === lngLat[0] && el[1] === lngLat[1],
        );

        if (idx !== -1) {
          return prev;
        }

        newSet.push(lngLat);

        return {
          ...prev,
          bounds: newSet,
        };
      });
    } catch (err) {}

    return () => {
      marker?.remove();
    };
  }, [
    state.map,
    state.mapContainer,
    setState,
    anchor,
    clickTolerance,
    color,
    draggable,
    pitchAlignment,
    rotation,
    rotationAlignment,
    scale,
    offset,
    element,
    latitude,
    longitude,
    className,
    onClick,
    popup,
  ]);

  return null;
});
