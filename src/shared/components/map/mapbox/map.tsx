import { ReactElement, useEffect, useRef } from 'react';
import mapboxgl, { LngLatBounds, LngLatLike, Marker, Popup } from 'mapbox-gl';
import { MAPBOX_API_KEY, MAPBOX_STYLE_URL } from '@/shared/lib/constants';
import { renderToStaticMarkup } from 'react-dom/server';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  ServiceAreaGeoJSON,
  normalizeServiceArea,
  getBoundsFromServiceArea,
  MarkerDef,
} from '../map-shared';

type MapProps = {
  center?: [number, number];
  zoom?: number;
  markers: MarkerDef[];
  usersLocation: any[];
  disableUserLocation?: boolean;
  serviceArea?: ServiceAreaGeoJSON;
};

export function Map({
  center,
  zoom,
  markers,
  usersLocation,
  disableUserLocation,
  serviceArea,
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

      const hasValidCoordinates =
        m.coordinates && !isNaN(m.coordinates[0]) && !isNaN(m.coordinates[1]);

      if (hasValidCoordinates) {
        marker.setLngLat(m.coordinates as [number, number]);
        marker.addTo(mapboxMap.current);
        bounds.extend(m.coordinates as [number, number]);
      }

      const markerElement = marker.getElement();
      markerElement.style.cursor = 'pointer';
      markerElement.classList.add('custom-marker');
      markerElement.addEventListener('click', () => {
        const listElement = document.getElementById(m.id);
        listElement?.scrollIntoView();

        _markers.current?.forEach((mm) => {
          const popup = mm.getPopup();
          if (popup?.isOpen()) {
            mm.togglePopup();
          }
        });

        marker.togglePopup();
      });

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

  // --- Service Area (Polygon) rendering when no valid markers ---
  useEffect(() => {
    if (!mapboxMap.current) return;
    const map = mapboxMap.current as any;
    const hasMarkers =
      Array.isArray(markers) &&
      markers.some(
        (m) =>
          m.coordinates && !isNaN(m.coordinates[0]) && !isNaN(m.coordinates[1]),
      );

    const cleanup = () => {
      if (map.getLayer('service-area-fill'))
        map.removeLayer('service-area-fill');
      if (map.getLayer('service-area-outline'))
        map.removeLayer('service-area-outline');
      if (map.getSource('service-area')) map.removeSource('service-area');
    };

    if (hasMarkers || !serviceArea) {
      cleanup();
      return;
    }

    const normalized = normalizeServiceArea(
      JSON.parse(JSON.stringify(serviceArea)),
    );
    if (!normalized) return;

    const sourceData = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: normalized, properties: {} }],
    } as any;

    const addLayer = () => {
      cleanup();
      map.addSource('service-area', { type: 'geojson', data: sourceData });
      map.addLayer({
        id: 'service-area-fill',
        type: 'fill',
        source: 'service-area',
        paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.25 },
      });
      map.addLayer({
        id: 'service-area-outline',
        type: 'line',
        source: 'service-area',
        paint: { 'line-color': '#2563eb', 'line-width': 2 },
      });
      const b = getBoundsFromServiceArea(normalized);
      if (b) map.fitBounds(b, { padding: 40, animate: false });
    };

    if (map.isStyleLoaded && map.isStyleLoaded()) addLayer();
    else map.once('load', addLayer);
    return () => cleanup();
  }, [serviceArea, markers]);

  return <div ref={mapContainer} className="h-full w-full"></div>;
}
