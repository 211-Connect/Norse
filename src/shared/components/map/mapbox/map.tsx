import { ReactElement, useEffect, useMemo, useRef } from 'react';
import mapboxgl, { LngLatBounds, Marker, Popup } from 'mapbox-gl';
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
};

export function Map({ center, zoom, markers }: MapProps) {
  const mapContainer = useRef();
  const mapboxMap = useRef<mapboxgl.Map>(null);
  const _markers = useRef(null);

  const data = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: markers
        .filter((m) => m.coordinates)
        .map((m, key) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: m.coordinates,
          },
          properties: {
            name: `Point ${key}`,
          },
        })),
    };
  }, [markers]);

  useEffect(() => {
    mapboxMap.current = new mapboxgl.Map({
      container: mapContainer.current as HTMLDivElement, // container ID or element
      style: MAPBOX_STYLE_URL, // style URL
      zoom: zoom ?? 7, // starting zoom
      center: center ?? undefined,
      accessToken: MAPBOX_API_KEY,
      trackResize: true,
    });

    mapboxMap.current.on('load', () => {
      const bounds = new LngLatBounds();

      data.features.forEach((feature) => {
        bounds.extend(feature.geometry.coordinates);
      });

      mapboxMap.current.fitBounds(bounds, { padding: 25, animate: false });

      mapboxMap.current.addSource('locations', {
        type: 'geojson',
        data: data as any, // Casting to avoid weird typing issues with Mapbox SDK
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      mapboxMap.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'locations',
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
        id: 'cluster-count',
        type: 'symbol',
        source: 'locations',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
      });

      mapboxMap.current.addLayer({
        id: 'unclustered-point',
        type: 'symbol',
        source: 'locations',
        filter: ['!', ['has', 'point_count']],
        paint: {
          // 'icon-image': 'marker-15',
          // 'icon-size': 1,
        },
      });
    });

    return () => {
      mapboxMap.current?.remove();
    };
  }, [center, zoom, data]);

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

  //   if (!bounds.isEmpty()) {
  //     if (_markers.current.length > 1) {
  //       mapboxMap.current.fitBounds(bounds, { padding: 100, animate: false });
  //     } else {
  //       mapboxMap.current.fitBounds(bounds, {
  //         padding: 100,
  //         zoom: 13,
  //         animate: false,
  //       });
  //     }
  //   }
  // }, [markers]);

  return <div ref={mapContainer} className="h-full w-full"></div>;
}
