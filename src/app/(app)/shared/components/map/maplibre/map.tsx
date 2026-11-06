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
  getCoreExtent,
  normalizeServiceArea,
} from '../map-shared';
import {
  bindPointEvents,
  removePointsLayer,
  setPointsData,
} from './points-layer';

const log = createLogger('maplibre');

/** The user's pin next to result circles: smaller, so it doesn't hide them. */
const COMPACT_MARKER_SCALE = 0.72;

/** What a reader does to the map, as opposed to a fit or a popup moving it. */
const INTERACTION_EVENTS = ['pointerdown', 'wheel', 'keydown'] as const;

/**
 * Lets a keyboard reach a circle drawn on the canvas. It shows only as a focus
 * ring, and the mouse goes through it to the canvas.
 */
const createPointFocusTarget = () => {
  const element = document.createElement('div');
  element.className = 'point-focus-target';

  return element;
};

const POPUP_MAP_MARGIN_PX = 8;
const POPUP_WIDTH_PX = 240;
const SITE_POPUP_WIDTH_PX = 320;

const getPopupOverflow = (
  start: number,
  end: number,
  mapStart: number,
  mapEnd: number,
) =>
  Math.max(0, end + POPUP_MAP_MARGIN_PX - mapEnd) ||
  Math.min(0, start - POPUP_MAP_MARGIN_PX - mapStart);

const scrollToResult = (id: string) => {
  setTimeout(() => {
    document.getElementById(id)?.scrollIntoView();
  });
};

const getCoreBounds = (coordinates: [number, number][]) => {
  const extent = getCoreExtent(coordinates);

  return extent ? new LngLatBounds(extent[0], extent[1]) : new LngLatBounds();
};

type MapProps = {
  center?: [number, number];
  zoom?: number;
  markers: MarkerDef[];
  usersLocation: any[];
  disableUserLocation?: boolean;
  serviceArea?: ServiceAreaGeoJSON;
  points?: MarkerDef[];
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
  points,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapLibreMap = useRef<any>(null);
  const _markers = useRef<maplibregl.Marker[]>([]);
  const popupDialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusOnCloseRef = useRef(true);
  const pointPopupRef = useRef<maplibregl.Popup | null>(null);
  const pointsRef = useRef(points);
  const lastFitKeyRef = useRef<string | null>(null);
  // Points load after the page's markers; a reader who has used the map by then keeps their view.
  const fittedMarkersOnlyRef = useRef(false);
  const userInteractedRef = useRef(false);

  const [activePopup, setActivePopup] = useState<{
    element: HTMLElement;
    popup: any;
    popupId: string;
    label: string;
    closePopup: () => void;
    fitInMap: () => void;
  } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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
        // Keeps the result counts from hiding the basemap's labels, or the reverse.
        crossSourceCollisions: false,
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

      mapLibreMap.current.once('load', () => setIsMapLoaded(true));

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

    // Camera events don't say who moved the map (a wheel zoom carries no
    // original event), so any pointer, wheel or key on the map counts.
    const container = mapContainer.current;
    const markInteraction = () => {
      userInteractedRef.current = true;
    };
    for (const type of INTERACTION_EVENTS) {
      container?.addEventListener(type, markInteraction, { passive: true });
    }

    return () => {
      for (const type of INTERACTION_EVENTS) {
        container?.removeEventListener(type, markInteraction);
      }
      // Remove and clear ref so other effects don't act on a torn-down map
      mapLibreMap.current?.remove();
      mapLibreMap.current = null;
      lastFitKeyRef.current = null;
      fittedMarkersOnlyRef.current = false;
      userInteractedRef.current = false;
      setIsMapLoaded(false);
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!activePopup) return;

    requestAnimationFrame(() => {
      activePopup.fitInMap();
      // Focus the dialog, not the close button: script focus on a button paints
      // its focus ring even after a mouse click. Tab still reaches the button.
      popupDialogRef.current?.focus();
    });
  }, [activePopup]);

  const createResourcePopup = (m: MarkerDef, restoreFocus: () => void) => {
    const popupDiv = document.createElement('div');
    const popup = new Popup({
      focusAfterOpen: false,
      closeButton: false,
      maxWidth: 'none',
    }).setDOMContent(popupDiv);

    popup.on('open', () => {
      setActivePopup({
        element: popupDiv,
        popup: m.popup,
        popupId: `map-popup-${m.id}`,
        label: m.label?.trim() || 'resource',
        closePopup: () => {
          restoreFocusOnCloseRef.current = true;
          popup.remove();
        },
        fitInMap: () => {
          const map = mapLibreMap.current;
          if (!map) return;

          const mapRect = map.getContainer().getBoundingClientRect();

          // A wider popup wraps a site's resource names less, so its list stays
          // short. A list longer than the map itself is the only one that scrolls.
          const width =
            (m.count ?? 1) > 1 ? SITE_POPUP_WIDTH_PX : POPUP_WIDTH_PX;
          popupDiv.style.width = `${Math.min(width, mapRect.width - 2 * POPUP_MAP_MARGIN_PX)}px`;
          popupDiv.style.setProperty(
            '--map-popup-max-height',
            `${mapRect.height - 2 * POPUP_MAP_MARGIN_PX}px`,
          );
          // MapLibre placed the popup while it was empty. Now it has a real size.
          popup.setLngLat(popup.getLngLat());

          const rect = popup.getElement().getBoundingClientRect();
          const overflowX = getPopupOverflow(
            rect.left,
            rect.right,
            mapRect.left,
            mapRect.right,
          );
          const overflowY = getPopupOverflow(
            rect.top,
            rect.bottom,
            mapRect.top,
            mapRect.bottom,
          );

          if (overflowX || overflowY) map.panBy([overflowX, overflowY]);
        },
      });
    });

    popup.on('close', () => {
      setActivePopup(null);
      if (restoreFocusOnCloseRef.current) {
        requestAnimationFrame(restoreFocus);
      }
    });

    return popup;
  };

  useEffect(() => {
    if (!mapLibreMap.current) return;
    const bounds = new LngLatBounds();

    _markers.current?.forEach((m) => m.remove());

    _markers.current = markers.map((m) => {
      const marker = new Marker(
        points ? { element: createPointFocusTarget() } : undefined,
      );
      const markerElement = marker.getElement();
      const markerLabel = m.label?.trim() || 'resource';
      const popupId = `map-popup-${m.id}`;

      const hasValidCoordinates = isValidCoordinate(m.coordinates);

      if (hasValidCoordinates) {
        marker.setLngLat(m.coordinates!);
        if (m.popup) {
          markerElement.style.cursor = 'pointer';
          markerElement.setAttribute('tabindex', '0');
          markerElement.setAttribute('role', 'button');
          markerElement.setAttribute(
            'aria-label',
            `Map marker for ${markerLabel}`,
          );
          markerElement.setAttribute('aria-haspopup', 'dialog');
          markerElement.setAttribute('aria-controls', popupId);
          markerElement.removeAttribute('aria-disabled');
        } else {
          markerElement.removeAttribute('tabindex');
          markerElement.removeAttribute('role');
          markerElement.removeAttribute('aria-label');
          markerElement.removeAttribute('aria-haspopup');
          markerElement.removeAttribute('aria-controls');
          markerElement.setAttribute('aria-disabled', 'true');
        }
        markerElement.classList.add('custom-marker');
        markerElement.addEventListener('click', () => {
          // Built on first use. MapLibre's click handler on the map runs after
          // this one, as the event bubbles, and opens it.
          if (m.popup && !marker.getPopup()) {
            marker.setPopup(
              createResourcePopup(m, () => {
                markerElement.focus();
              }),
            );
          }

          scrollToResult(m.id);
          restoreFocusOnCloseRef.current = false;
          pointPopupRef.current?.remove();
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
          if (!m.popup) return;

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

    let userMarker: maplibregl.Marker | null = null;

    // Add users location as a map pin
    if (
      usersLocation?.length > 0 &&
      !isNaN(usersLocation[0]) &&
      !isNaN(usersLocation[1])
    ) {
      const marker = new Marker(
        points ? { scale: COMPACT_MARKER_SCALE } : undefined,
      );

      marker.setLngLat(usersLocation as LngLatLike);

      const markerElement = marker.getElement();
      markerElement.classList.add('users-location-marker');
      applyMarkerSemantics(markerElement, false);
      marker.addTo(mapLibreMap.current);

      userMarker = marker;
      _markers.current.push(marker);

      if (!disableUserLocation) {
        bounds.extend(usersLocation as LngLatLike);
      }
    }

    const fitCoordinates = points
      ? [...points, ...markers].flatMap((m) =>
          isValidCoordinate(m.coordinates) ? [m.coordinates] : [],
        )
      : [];

    // Points hold every result, so turning the list's page only swaps which of
    // them are pins: the same places, which must not move the map under the
    // reader. Compared by place, as a shared address's id changes with the page.
    const fitKey = points
      ? [...new Set(fitCoordinates.map((coordinates) => coordinates.join()))]
          .sort()
          .concat(usersLocation ?? [])
          .join(';')
      : null;
    const isSameSet = fitKey !== null && fitKey === lastFitKeyRef.current;
    lastFitKeyRef.current = fitKey;
    const fittedCount = _markers.current.length + (points?.length ?? 0);

    // A few distant results shouldn't zoom every search out to the continent.
    const fitTarget = points ? getCoreBounds(fitCoordinates) : bounds;

    if (points && userMarker && !disableUserLocation) {
      fitTarget.extend(usersLocation as LngLatLike);
    }

    const keepsUserView =
      Boolean(points) &&
      fittedMarkersOnlyRef.current &&
      userInteractedRef.current;
    fittedMarkersOnlyRef.current = !points;

    if (!fitTarget.isEmpty() && !isSameSet && !keepsUserView) {
      userInteractedRef.current = false;
      if (fittedCount > 0 && fittedCount <= 2) {
        mapLibreMap.current.fitBounds(fitTarget, {
          padding: 50,
          animate: false,
          maxZoom: 15, // Zoom level for single or two markers
        });
      } else if (fittedCount > 0) {
        mapLibreMap.current.fitBounds(fitTarget, {
          padding: 50,
          animate: false,
          maxZoom: 13, // Add maximum zoom constraint for multiple locations
        });
      } else {
        mapLibreMap.current.fitBounds(fitTarget, {
          zoom: zoom,
          animate: false,
          maxZoom: 12, // Add maximum zoom constraint for fallback
        });
      }
    }
  }, [markers, points, usersLocation, disableUserLocation, zoom]);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    const map: maplibregl.Map | null = mapLibreMap.current;
    if (!map || !isMapLoaded) return;

    pointPopupRef.current?.remove();

    if (points) setPointsData(map, points);
    else removePointsLayer(map);
  }, [points, isMapLoaded]);

  useEffect(() => {
    const map: maplibregl.Map | null = mapLibreMap.current;
    if (!map) return;

    return bindPointEvents(map, (id, coordinates) => {
      const point = pointsRef.current?.find((candidate) => candidate.id === id);
      if (!point?.popup) return;

      scrollToResult(id);
      restoreFocusOnCloseRef.current = false;
      pointPopupRef.current?.remove();
      _markers.current.forEach((marker) => marker.getPopup()?.remove());
      restoreFocusOnCloseRef.current = true;

      pointPopupRef.current = createResourcePopup(point, () => {
        map.getCanvas().focus();
      })
        .setLngLat(coordinates)
        .addTo(map);
    });
  }, [center, zoom]);

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
                ref={popupDialogRef}
                tabIndex={-1}
                className="outline-none"
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
                  <button
                    type="button"
                    aria-label={`Close details for ${activePopup.label}`}
                    className="text-muted-foreground ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring absolute top-1.5 right-1.5 z-10 flex size-7 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    onClick={activePopup.closePopup}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
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
