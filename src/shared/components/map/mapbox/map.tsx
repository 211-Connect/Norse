import React, {
  ReactElement,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import mapboxgl, { LngLatBounds, LngLatLike, Marker, Popup } from 'mapbox-gl';
import { MAPBOX_API_KEY, MAPBOX_STYLE_URL } from '@/shared/lib/constants';
import { renderToStaticMarkup } from 'react-dom/server';
import 'mapbox-gl/dist/mapbox-gl.css';

type MapProps = {
  center?: [number, number];
  zoom?: number;
  markers: {
    id: string;
    coordinates?: [number, number];
    popup?: ReactElement;
  }[];
  usersLocation: any[];
};

export const Map = React.memo(
  ({ center, zoom, markers, usersLocation }: MapProps) => {
    const mapContainer = useRef();
    const mapboxMap = useRef<mapboxgl.Map>(null);
    const [mapIsLoaded, setMapIsLoaded] = useState(false);
    const _markers = useRef(null);

    useEffect(() => {
      if (!mapIsLoaded) return;

      const bounds = new LngLatBounds();

      mapboxMap.current.addSource('points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: markers.map((marker) => {
            bounds.extend(marker.coordinates);

            return {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: marker.coordinates,
              },
            };
          }),
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      mapboxMap.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'points',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1',
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40,
          ],
        },
      });

      mapboxMap.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'points',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 4,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        },
      });

      mapboxMap.current.fitBounds(bounds);
    }, [mapIsLoaded, markers, usersLocation]);

    useEffect(() => {
      mapboxMap.current = new mapboxgl.Map({
        container: mapContainer.current as HTMLDivElement, // container ID or element
        style: MAPBOX_STYLE_URL, // style URL
        accessToken: MAPBOX_API_KEY,
        trackResize: true,
      });

      mapboxMap.current.on('style.load', () => {
        setMapIsLoaded(true);
      });

      return () => {
        console.log('unloading');
        mapboxMap.current?.remove();
        setMapIsLoaded(false);
      };
    }, []);

    useEffect(() => {
      if (!mapIsLoaded) return;
      mapboxMap.current.setZoom(zoom);
      mapboxMap.current.setCenter(center);
    }, [center, zoom, mapIsLoaded]);

    // useEffect(() => {
    //   if (!mapboxMap.current) return;
    //   const bounds = new LngLatBounds();

    //   _markers.current?.forEach((m) => m.remove());

    //   _markers.current = markers.map((m) => {
    //     const marker = new Marker().setPopup(
    //       m.popup
    //         ? new Popup().setHTML(renderToStaticMarkup(m.popup))
    //         : undefined,
    //     );

    //     if (m.coordinates) {
    //       marker.setLngLat(m.coordinates);
    //     }

    //     const markerElement = marker.getElement();
    //     markerElement.style.cursor = 'pointer';
    //     markerElement.classList.add('custom-marker');
    //     markerElement.addEventListener('click', (e) => {
    //       const listElement = document.getElementById(m.id);
    //       listElement?.scrollIntoView();

    //       _markers.current?.forEach((m) => {
    //         const popup = m.getPopup();
    //         if (popup?.isOpen()) {
    //           m.togglePopup();
    //         }
    //       });

    //       marker.togglePopup();
    //     });

    //     if (m.coordinates) {
    //       marker.addTo(mapboxMap.current);
    //     }

    //     bounds.extend(m.coordinates);

    //     return marker;
    //   });

    //   // Add users location as a map pin
    //   if (usersLocation?.length > 0) {
    //     const marker = new Marker();

    //     marker.setLngLat(usersLocation as LngLatLike);

    //     const markerElement = marker.getElement();
    //     markerElement.classList.add('users-location-marker');
    //     marker.addTo(mapboxMap.current);

    //     _markers.current.push(marker);

    //     bounds.extend(usersLocation as LngLatLike);
    //   }

    //   if (!bounds.isEmpty()) {
    //     if (_markers.current.length > 0 && _markers.current.length <= 2) {
    //       mapboxMap.current.fitBounds(bounds, {
    //         padding: 50,
    //         animate: false,
    //         zoom: 15,
    //       });
    //     } else if (_markers.current.length > 0) {
    //       mapboxMap.current.fitBounds(bounds, { padding: 50, animate: false });
    //     } else {
    //       mapboxMap.current.fitBounds(bounds, {
    //         zoom: zoom,
    //         animate: false,
    //       });
    //     }
    //   }
    // }, [markers, usersLocation, zoom]);

    return <div ref={mapContainer} className="h-full w-full"></div>;
  },
);

Map.displayName = 'MapboxMap';
