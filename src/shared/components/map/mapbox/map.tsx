import { ReactElement, useEffect, useRef } from 'react';
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
  disableUserLocation?: boolean;
};

export function Map({
  center,
  zoom,
  markers,
  usersLocation,
  disableUserLocation,
}: MapProps) {
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

      if (
        m.coordinates &&
        !isNaN(m.coordinates[0]) &&
        !isNaN(m.coordinates[1])
      ) {
        marker.setLngLat(m.coordinates);
        marker.addTo(mapboxMap.current);
        bounds.extend(m.coordinates); // Only extend if coordinates are valid
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
    if (
      usersLocation?.length > 0 &&
      !isNaN(usersLocation[0]) &&
      !isNaN(usersLocation[1])
    ) {
      const marker = new Marker();

      marker.setLngLat(usersLocation as LngLatLike);

      const markerElement = marker.getElement();
      markerElement.classList.add('users-location-marker');
      marker.addTo(mapboxMap.current);

      _markers.current.push(marker);

      if (!disableUserLocation) {
        bounds.extend(usersLocation as LngLatLike);
      }
    }

    if (!bounds.isEmpty()) {
      if (_markers.current.length > 0 && _markers.current.length <= 2) {
        mapboxMap.current.fitBounds(bounds, {
          padding: 50,
          animate: false,
          zoom: 15, // Zoom level for single or two markers
        });
      } else if (_markers.current.length > 0) {
        mapboxMap.current.fitBounds(bounds, {
          padding: 50,
          animate: false,
          maxZoom: 13, // Add maximum zoom constraint for multiple locations
        });
      } else {
        mapboxMap.current.fitBounds(bounds, {
          zoom: zoom,
          animate: false,
          maxZoom: 12, // Add maximum zoom constraint for fallback
        });
      }
    }
  }, [markers, usersLocation, disableUserLocation, zoom]);

  return <div ref={mapContainer} className="h-full w-full"></div>;
}
