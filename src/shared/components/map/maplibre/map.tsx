import { ReactElement, useEffect, useRef } from 'react';
import mapLibreGl, {
  LngLatBounds,
  LngLatLike,
  Marker,
  Popup,
} from 'maplibre-gl';
import { MAPLIBRE_STYLE_URL } from '@/shared/lib/constants';
import { Protocol } from 'pmtiles';
import { renderToStaticMarkup } from 'react-dom/server';
import 'maplibre-gl/dist/maplibre-gl.css';

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

// Allows maplibre to load pmtiles from a single hosted file
// https://docs.protomaps.com/pmtiles/maplibre
const protocol = new Protocol();
mapLibreGl.addProtocol('pmtiles', protocol.tile);

export function Map({
  center,
  zoom,
  markers,
  usersLocation,
  disableUserLocation,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapLibreMap = useRef<mapLibreGl.Map>();
  const _markers = useRef<maplibregl.Marker[]>();

  useEffect(() => {
    mapLibreMap.current = new mapLibreGl.Map({
      container: mapContainer.current as HTMLDivElement,
      style: MAPLIBRE_STYLE_URL,
      zoom: zoom ?? 7, // starting zoom
      center: center ?? undefined,
      trackResize: true,
    });

    return () => {
      mapLibreMap.current?.remove();
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!mapLibreMap.current) return;
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

      if (m.coordinates && mapLibreMap.current) {
        marker.addTo(mapLibreMap.current);
      }

      if (m.coordinates) {
        bounds.extend(m.coordinates);
      }

      return marker;
    });

    // Add users location as a map pin
    if (usersLocation?.length > 0) {
      const marker = new Marker();

      marker.setLngLat(usersLocation as LngLatLike);

      const markerElement = marker.getElement();
      markerElement.classList.add('users-location-marker');
      marker.addTo(mapLibreMap.current);

      _markers.current.push(marker);

      if (!disableUserLocation) {
        bounds.extend(usersLocation as LngLatLike);
      }
    }

    if (!bounds.isEmpty()) {
      if (_markers.current.length > 0 && _markers.current.length <= 2) {
        mapLibreMap.current.fitBounds(bounds, {
          padding: 50,
          animate: false,
          zoom: 15,
        });
      } else if (_markers.current.length > 0) {
        mapLibreMap.current.fitBounds(bounds, { padding: 50, animate: false });
      } else {
        mapLibreMap.current.fitBounds(bounds, {
          zoom: zoom,
          animate: false,
        });
      }
    }
  }, [markers, usersLocation, disableUserLocation, zoom]);

  return <div ref={mapContainer} className="h-full w-full"></div>;
}
