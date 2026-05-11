'use client';

import { X } from 'lucide-react';
import mapLibreGl, {
  AttributionControl,
  LngLatBounds,
  LngLatLike,
  Marker,
  Popup,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { MAPLIBRE_STYLE_URL } from '@/app/(app)/shared/lib/constants';
import { createLogger } from '@/lib/logger';
import { isValidCoordinate } from '@/utils/isValidCoordinate';

import { MapErrorFallback } from '../map-error-fallback';
import {
  MarkerDef,
  ServiceAreaGeoJSON,
  getBoundsFromServiceArea,
  normalizeServiceArea,
} from '../map-shared';

const log = createLogger('maplibre');

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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusOnCloseRef = useRef(true);

  const [activePopup, setActivePopup] = useState<{
    element: HTMLElement;
    popup: any;
    popupId: string;
    label: string;
    closePopup: () => void;
  } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const patchAttributionToggleAccessibility = () => {
    const attributionToggle = mapContainer.current?.querySelector<HTMLElement>(
      '.maplibregl-ctrl-attrib-button',
    );

    if (!attributionToggle) return;

    attributionToggle.removeAttribute('aria-label');

    if (attributionToggle.textContent?.trim()) return;

    const screenReaderLabel = document.createElement('span');
    screenReaderLabel.className = 'sr-only';
    screenReaderLabel.textContent = 'Toggle attribution';
    attributionToggle.append(screenReaderLabel);
  };

  const applyMarkerSemantics = (
    markerElement: HTMLElement,
    interactive: boolean,
  ) => {
    if (!interactive) {
      markerElement.removeAttribute('aria-label');
      markerElement.removeAttribute('role');
      markerElement.removeAttribute('tabindex');
      markerElement.setAttribute('aria-hidden', 'true');
      return;
    }

    markerElement.removeAttribute('aria-hidden');
  };

  useEffect(() => {
    try {
      mapLibreMap.current = new mapLibreGl.Map({
        container: mapContainer.current || '',
        style: MAPLIBRE_STYLE_URL,
        zoom: zoom ?? 7,
        center: center ?? undefined,
        trackResize: true,
        attributionControl: false,
      });
      mapLibreMap.current.addControl(
        new AttributionControl({
          compact: true,
          customAttribution:
            '<a href="https://maplibre.org/" target="_blank">MapLibre</a>',
        }),
        'bottom-right',
      );
      requestAnimationFrame(() => {
        patchAttributionToggleAccessibility();
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

  useEffect(() => {
    if (!activePopup) return;

    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
  }, [activePopup]);

  useEffect(() => {
    if (!mapLibreMap.current) return;
    const bounds = new LngLatBounds();

    _markers.current?.forEach((m) => m.remove());

    _markers.current = markers.map((m) => {
      const marker = new Marker();
      const markerElement = marker.getElement();
      const markerLabel = m.label?.trim() || 'resource';
      const popupId = `map-popup-${m.id}`;

      if (m.popup) {
        const popupDiv = document.createElement('div');
        popupDiv.style.minHeight = '200px';
        popupDiv.style.width = '240px';
        const popup = new Popup({
          focusAfterOpen: false,
          closeButton: false,
        }).setDOMContent(popupDiv);

        popup.on('open', () => {
          markerElement.setAttribute('aria-expanded', 'true');
          setActivePopup({
            element: popupDiv,
            popup: m.popup,
            popupId,
            label: markerLabel,
            closePopup: () => {
              restoreFocusOnCloseRef.current = true;
              popup.remove();
            },
          });
        });

        popup.on('close', () => {
          markerElement.setAttribute('aria-expanded', 'false');
          setActivePopup(null);
          if (restoreFocusOnCloseRef.current) {
            requestAnimationFrame(() => {
              markerElement.focus();
            });
          }
        });

        marker.setPopup(popup);
      }

      const hasValidCoordinates = isValidCoordinate(m.coordinates);

      if (hasValidCoordinates) {
        marker.setLngLat(m.coordinates!);
        if (marker.getPopup()) {
          markerElement.style.cursor = 'pointer';
          markerElement.setAttribute('tabindex', '0');
          markerElement.setAttribute('role', 'button');
          markerElement.setAttribute(
            'aria-label',
            `Open map details for ${markerLabel}`,
          );
          markerElement.setAttribute('aria-haspopup', 'dialog');
          markerElement.setAttribute('aria-expanded', 'false');
          markerElement.setAttribute('aria-controls', popupId);
          markerElement.removeAttribute('aria-disabled');
        } else {
          markerElement.removeAttribute('tabindex');
          markerElement.removeAttribute('role');
          markerElement.removeAttribute('aria-label');
          markerElement.removeAttribute('aria-haspopup');
          markerElement.removeAttribute('aria-expanded');
          markerElement.removeAttribute('aria-controls');
          markerElement.setAttribute('aria-disabled', 'true');
        }
        markerElement.classList.add('custom-marker');
        markerElement.addEventListener('click', () => {
          setTimeout(() => {
            const listElement = document.getElementById(m.id);
            listElement?.scrollIntoView();
          });
          restoreFocusOnCloseRef.current = false;
          _markers.current?.forEach((otherMarker) => {
            if (otherMarker !== marker) {
              const otherPopup = otherMarker.getPopup();
              if (otherPopup && otherPopup.isOpen()) {
                otherPopup.remove();
              }
            }
          });
          restoreFocusOnCloseRef.current = true;
        });
        markerElement.addEventListener('keydown', (event) => {
          if (!marker.getPopup()) return;

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            markerElement.click();
          }

          if (event.key === 'Escape' && marker.getPopup()?.isOpen()) {
            event.preventDefault();
            restoreFocusOnCloseRef.current = true;
            marker.getPopup()?.remove();
          }
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
      applyMarkerSemantics(markerElement, false);
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
          maxZoom: 15, // Zoom level for single or two markers
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
      markers.some((m) => isValidCoordinate(m.coordinates));
    let cancelled = false;

    const safeHasLayer = (id: string) => {
      try {
        return !!map?.style && !!map.getLayer(id);
      } catch {
        return false;
      }
    };

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
  }, [serviceArea, markers]);

  return (
    <div className="size-full">
      {mapError ? (
        <MapErrorFallback error={mapError} />
      ) : (
        <>
          <div ref={mapContainer} className="size-full"></div>
          {activePopup &&
            createPortal(
              <div
                id={activePopup.popupId}
                role="dialog"
                aria-modal="false"
                aria-label={`${activePopup.label} details`}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    activePopup.closePopup();
                  }
                }}
              >
                <div className="relative">
                  <div className="absolute right-2 top-2 z-10">
                    <button
                      ref={closeButtonRef}
                      type="button"
                      aria-label={`Close details for ${activePopup.label}`}
                      className="rounded-md p-1 text-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={activePopup.closePopup}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  {activePopup.popup}
                </div>
              </div>,
              activePopup.element,
            )}
        </>
      )}
    </div>
  );
}
