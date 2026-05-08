'use client';

import { MAPLIBRE_STYLE_URL } from '@/app/(app)/shared/lib/constants';
import { createLogger } from '@/lib/logger';
import mapLibreGl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import { useEffect, useRef, useState } from 'react';

import { MapErrorFallback } from '../../../app/(app)/shared/components/map/map-error-fallback';
import {
  ServiceAreaGeoJSON,
  getBoundsFromServiceArea,
  normalizeServiceArea,
} from '../../../app/(app)/shared/components/map/map-shared';
import { HeatmapPoint } from './types';

const log = createLogger('maplibre');

type MapProps = {
  center?: [number, number];
  zoom?: number;
  serviceArea?: ServiceAreaGeoJSON;
  heatmapPoints?: HeatmapPoint[];
};

// Allows maplibre to load pmtiles from a single hosted file
// https://docs.protomaps.com/pmtiles/maplibre
const protocol = new Protocol();
mapLibreGl.addProtocol('pmtiles', protocol.tile);

export function AnalyticsMap({
  center,
  zoom,
  serviceArea,
  heatmapPoints,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapLibreMap = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    try {
      mapLibreMap.current = new mapLibreGl.Map({
        container: mapContainer.current || '',
        style: MAPLIBRE_STYLE_URL,
        zoom: zoom ?? 7,
        center: center ?? undefined,
        trackResize: true,
      });

      mapLibreMap.current.on('error', (e: any) => {
        log.error({ err: e.error ?? e }, 'MapLibre error');
        if (e.error?.message?.includes('WebGL')) {
          setMapError('WebGL is not supported on this device');
        }
      });
    } catch (error: any) {
      log.error({ err: error }, 'Failed to initialize MapLibre map');
      setMapError(
        error.message?.includes('WebGL')
          ? 'WebGL is not supported on this device'
          : 'Failed to load map',
      );
    }

    return () => {
      // Remove and clear ref so other effects don't act on a torn-down map
      mapLibreMap.current?.remove();
      mapLibreMap.current = null;
    };
  }, [center, zoom]);

  // The map component displays a service area polygon when there are no valid markers.
  // normalizeServiceArea: Ensures all polygon rings are closed and supports Polygon, MultiPolygon, and GeometryCollection types. It modifies the geometry so it is valid for rendering.
  // getBoundsFromServiceArea: Calculates the bounding box for the geometry (including inside a GeometryCollection) by scanning all coordinates.
  // When rendering, the normalized geometry is added as a GeoJSON source/layer. The map then uses the bounds from getBoundsFromServiceArea to fit the view to the service area, with padding.
  // This ensures the service area is always visible and correctly framed on the map.
  useEffect(() => {
    if (!mapLibreMap.current) return;

    const map = mapLibreMap.current as any;
    let cancelled = false;

    // Cleanup helper with guards (map may be removed before style load)
    const cleanup = () => {
      try {
        if (map.getLayer('service-area-fill'))
          map.removeLayer('service-area-fill');
        if (map.getLayer('service-area-outline'))
          map.removeLayer('service-area-outline');
        if (map.getSource('service-area')) map.removeSource('service-area');
      } catch {}
    };

    if (!serviceArea) {
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
      if (cancelled) return;
      if (!map || !map.style) return;

      cleanup(); // Ensure clean slate

      try {
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
        if (b && !cancelled) {
          map.fitBounds(b, { padding: 40, animate: false });
        }
      } catch {
        // ignore race condition errors
      }
    };

    const handleLoad = () => addLayer();

    if (map.isStyleLoaded && map.isStyleLoaded()) {
      addLayer();
    } else {
      map.on('load', handleLoad);
    }

    return () => {
      cancelled = true;
      try {
        map.off && map.off('load', handleLoad);
      } catch {}
      cleanup();
    };
  }, [serviceArea]);

  // Heatmap layer – driven by heatmapPoints prop, independent of serviceArea
  useEffect(() => {
    const map = mapLibreMap.current as any;
    if (!map) return;
    let cancelled = false;

    const cleanup = () => {
      try {
        if (map.getLayer && map.getLayer('analytics-heat'))
          map.removeLayer('analytics-heat');
        if (map.getSource && map.getSource('analytics-heat-src'))
          map.removeSource('analytics-heat-src');
      } catch {}
    };

    const buildGeoJSON = () => ({
      type: 'FeatureCollection' as const,
      features: (heatmapPoints ?? []).map(([lng, lat, weight = 1]) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [lng, lat] },
        properties: { weight },
      })),
    });

    const addLayer = () => {
      if (cancelled || !map?.style) return;
      cleanup();
      try {
        map.addSource('analytics-heat-src', {
          type: 'geojson',
          data: buildGeoJSON(),
        });
        map.addLayer({
          id: 'analytics-heat',
          type: 'heatmap',
          source: 'analytics-heat-src',
          paint: {
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'weight'],
              0,
              0,
              1,
              1,
            ],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0,
              1,
              9,
              3,
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(33,102,172,0)',
              0.2,
              'rgb(103,169,207)',
              0.4,
              'rgb(209,229,240)',
              0.6,
              'rgb(253,219,199)',
              0.8,
              'rgb(239,138,98)',
              1,
              'rgb(178,24,43)',
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0,
              40,
              9,
              80,
            ],
            'heatmap-opacity': 0.85,
          },
        });
      } catch {}
    };

    if (map.isStyleLoaded && map.isStyleLoaded()) {
      addLayer();
    } else {
      map.on('load', addLayer);
    }

    return () => {
      cancelled = true;
      try {
        map.off && map.off('load', addLayer);
      } catch {}
      cleanup();
    };
  }, [heatmapPoints]);

  return (
    <div className="size-full" style={{ width: '100%', height: '100%' }}>
      {mapError ? (
        <MapErrorFallback error={mapError} />
      ) : (
        <>
          <div
            ref={mapContainer}
            className="size-full"
            style={{ width: '100%', height: '100%' }}
          ></div>
        </>
      )}
    </div>
  );
}
