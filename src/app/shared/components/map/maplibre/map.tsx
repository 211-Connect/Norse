'use client';

import { useEffect, useRef, useState } from 'react';
import mapLibreGl, {
  LngLatBounds,
  LngLatLike,
  Marker,
  Popup,
} from 'maplibre-gl';
import { MAPLIBRE_STYLE_URL } from '@/app/shared/lib/constants';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  ServiceAreaGeoJSON,
  normalizeServiceArea,
  getBoundsFromServiceArea,
  MarkerDef,
} from '../map-shared';
import { createPortal } from 'react-dom';

type MapProps = {
  center?: [number, number];
  zoom?: number;
  markers: MarkerDef[];
  usersLocation: any[];
  disableUserLocation?: boolean;
  serviceArea?: ServiceAreaGeoJSON;
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
  serviceArea,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapLibreMap = useRef<any>(null);
  const _markers = useRef<maplibregl.Marker[]>([]);

  const [activePopup, setActivePopup] = useState<{
    element: HTMLElement;
    popup: any;
  } | null>(null);

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
      const marker = new Marker();
      if (m.popup) {
        const popupDiv = document.createElement('div');
        const popup = new Popup({
          focusAfterOpen: false,
          closeButton: false,
        }).setDOMContent(popupDiv);

        popup.on('open', () => {
          setActivePopup({
            element: popupDiv,
            popup: m.popup,
          });
        });

        popup.on('close', () => {
          setActivePopup(null);
        });

        marker.setPopup(popup);
      }

      // Check if coordinates are valid before doing anything with them
      const hasValidCoordinates =
        m.coordinates && !isNaN(m.coordinates[0]) && !isNaN(m.coordinates[1]);

      if (hasValidCoordinates) {
        marker.setLngLat(m.coordinates!);

        const markerElement = marker.getElement();
        if (marker.getPopup()) {
          markerElement.style.cursor = 'pointer';
        }
        markerElement.classList.add('custom-marker');
        markerElement.addEventListener('click', (e) => {
          setTimeout(() => {
            const listElement = document.getElementById(m.id);
            listElement?.scrollIntoView();
          });
          _markers.current?.forEach((otherMarker) => {
            if (otherMarker !== marker) {
              const otherPopup = otherMarker.getPopup();
              if (otherPopup && otherPopup.isOpen()) {
                otherPopup.remove();
              }
            }
          });
        });

        marker.addTo(mapLibreMap.current);
        bounds.extend(m.coordinates!); // Only extend if coordinates are valid
      }

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
          zoom: 15, // Zoom level for single or two markers
        });
      } else if (_markers.current.length > 0) {
        mapLibreMap.current.fitBounds(bounds, {
          padding: 50,
          animate: false,
          maxZoom: 13, // Add maximum zoom constraint for multiple locations
        });
      } else {
        mapLibreMap.current.fitBounds(bounds, {
          zoom: zoom,
          animate: false,
          maxZoom: 12, // Add maximum zoom constraint for fallback
        });
      }
    }
  }, [markers, usersLocation, disableUserLocation, zoom]);

  // The map component displays a service area polygon when there are no valid markers.
  // normalizeServiceArea: Ensures all polygon rings are closed and supports Polygon, MultiPolygon, and GeometryCollection types. It modifies the geometry so it is valid for rendering.
  // getBoundsFromServiceArea: Calculates the bounding box for the geometry (including inside a GeometryCollection) by scanning all coordinates.
  // When rendering, the normalized geometry is added as a GeoJSON source/layer. The map then uses the bounds from getBoundsFromServiceArea to fit the view to the service area, with padding.
  // This ensures the service area is always visible and correctly framed on the map.
  useEffect(() => {
    if (!mapLibreMap.current) return;
    const map = mapLibreMap.current as any;
    const hasMarkers =
      Array.isArray(markers) &&
      markers.some(
        (m) =>
          m.coordinates && !isNaN(m.coordinates[0]) && !isNaN(m.coordinates[1]),
      );

    // Cleanup helper
    const cleanup = () => {
      try {
        if (map.getLayer('service-area-fill'))
          map.removeLayer('service-area-fill');
        if (map.getLayer('service-area-outline'))
          map.removeLayer('service-area-outline');
        if (map.getSource('service-area')) map.removeSource('service-area');
      } catch {}
    };

    if (hasMarkers || !serviceArea) {
      cleanup();
      return; // Nothing to do if we have markers or no polygon
    }

    const normalized = normalizeServiceArea(
      JSON.parse(JSON.stringify(serviceArea)),
    );
    if (!normalized) return;

    const sourceData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: normalized,
          properties: {},
        },
      ],
    } as any;

    const addLayer = () => {
      cleanup(); // Ensure clean slate
      map.addSource('service-area', { type: 'geojson', data: sourceData });
      map.addLayer({
        id: 'service-area-fill',
        type: 'fill',
        source: 'service-area',
        paint: {
          'fill-color': '#2563eb',
          'fill-opacity': 0.25,
        },
      });
      map.addLayer({
        id: 'service-area-outline',
        type: 'line',
        source: 'service-area',
        paint: {
          'line-color': '#2563eb',
          'line-width': 2,
        },
      });

      const b = getBoundsFromServiceArea(normalized);
      if (b) {
        map.fitBounds(b, { padding: 40, animate: false });
      }
    };

    if (map.isStyleLoaded && map.isStyleLoaded()) {
      addLayer();
    } else {
      map.once('load', addLayer);
    }

    return () => cleanup();
  }, [serviceArea, markers]);

  return (
    <div className="size-full">
      <div ref={mapContainer} className="size-full"></div>
      {activePopup && createPortal(activePopup.popup, activePopup.element)}
    </div>
  );
}
