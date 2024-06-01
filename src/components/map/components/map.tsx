import {
  Map,
  type Style,
  LngLatLike,
  LngLatBounds,
  FitBoundsOptions,
} from 'mapbox-gl';
import { ReactNode, memo, useCallback, useEffect } from 'react';
import { useAtom } from 'jotai';
import { mapAtom } from '../state';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxMap = memo(function MemoizedMapboxMap({
  children,
  style,
  center,
  accessToken,
  zoom,
  boundsPadding,
  boundsZoom,
  animate,
}: {
  children?: ReactNode;
  style?: Style;
  center?: LngLatLike;
  accessToken: string;
  zoom?: number;
  boundsPadding?: number;
  boundsZoom?: number;
  animate?: boolean;
}) {
  const [state, setState] = useAtom(mapAtom);

  useEffect(() => {
    if (!state?.mapContainer) return;

    const map = new Map({
      container: state.mapContainer,
      zoom: zoom,
      accessToken: accessToken,
      center,
      style,
    });

    const handleLoad = (ev) => {
      setState((prev) => ({
        ...prev,
        map,
      }));
    };
    map.on('load', handleLoad);

    return () => {
      map.remove();
      setState((prev) => ({
        ...prev,
        bounds: [],
      }));
    };
  }, [style, center, state?.mapContainer, accessToken, setState, zoom]);

  useEffect(() => {
    if (!state.bounds || !state.map) return;
    if (state.bounds.length === 0) return;

    let _bounds;
    for (const bound of state.bounds) {
      if (!_bounds) _bounds = new LngLatBounds(bound, bound);
      _bounds.extend(bound);
    }

    const boundOptions: FitBoundsOptions = {
      animate,
      padding: boundsPadding || 0,
    };

    if (boundsZoom) {
      boundOptions.zoom = boundsZoom;
    }

    setState((prev) => ({
      ...prev,
      map: state.map.fitBounds(_bounds, boundOptions),
    }));
  }, [state?.map, state?.bounds, setState, boundsPadding, boundsZoom, animate]);

  const setRefCallback = useCallback(
    (element: HTMLElement) => {
      setState((prev) => ({
        ...prev,
        mapContainer: element,
      }));
    },
    [setState],
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <div ref={setRefCallback} style={{ width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  );
});

export default MapboxMap;
