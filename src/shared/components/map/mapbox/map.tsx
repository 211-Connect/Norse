import { ReactElement, useEffect, useMemo, useRef } from 'react';
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

export function Map({ center, zoom, markers, usersLocation }: MapProps) {
  const mapContainer = useRef();
  const mapboxMap = useRef(null);
  const _markers = useRef(null);

  useEffect(() => {
    mapboxMap.current = new mapboxgl.Map({
      container: mapContainer.current as HTMLDivElement, // container ID or element
      style: MAPBOX_STYLE_URL, // style URL
      zoom: zoom ?? 7, // starting zoom
      center: center ?? undefined,
      accessToken: MAPBOX_API_KEY,
      trackResize: true,
    });

    return () => {
      mapboxMap.current?.remove();
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!mapboxMap.current) return;
    const bounds = new LngLatBounds();

    _markers.current?.forEach((m) => m.remove());

    _markers.current = markers.map((m) => {
      const marker = new Marker().setPopup(
        m.popup
          ? new Popup().setHTML(renderToStaticMarkup(m.popup))
          : undefined,
      );

      if (m.coordinates) {
        marker.setLngLat(m.coordinates);
      }

      const markerElement = marker.getElement();
      markerElement.style.cursor = 'pointer';
      markerElement.classList.add('custom-marker');
      markerElement.addEventListener('click', (e) => {
        const listElement = document.getElementById(m.id);
        listElement?.scrollIntoView();

        _markers.current?.forEach((m) => {
          const popup = m.getPopup();
          if (popup?.isOpen()) {
            m.togglePopup();
          }
        });

        marker.togglePopup();
      });

      if (m.coordinates) {
        marker.addTo(mapboxMap.current);
      }

      bounds.extend(m.coordinates);

      return marker;
    });

    // Add users location as a map pin
    if (usersLocation.length > 0) {
      const marker = new Marker();

      marker.setLngLat(usersLocation as LngLatLike);

      const markerElement = marker.getElement();
      markerElement.classList.add('users-location-marker');
      marker.addTo(mapboxMap.current);

      bounds.extend(usersLocation as LngLatLike);
    }

    if (!bounds.isEmpty()) {
      if (_markers.current.length > 1) {
        mapboxMap.current.fitBounds(bounds, { padding: 100, animate: false });
      } else {
        mapboxMap.current.fitBounds(bounds, {
          padding: 100,
          zoom: 13,
          animate: false,
        });
      }
    }
  }, [markers, usersLocation]);

  return <div ref={mapContainer} className="h-full w-full"></div>;
}
