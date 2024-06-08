import { ReactElement, useContext, useEffect } from 'react';
import { mapContext } from '../mapContext';
import Radar from 'radar-sdk-js';
import { renderToStaticMarkup } from 'react-dom/server';
import RadarMarker from 'radar-sdk-js/dist/ui/RadarMarker';

export default function Marker({
  latitude,
  longitude,
  popup,
  className,
  onClick,
  zoom,
}: {
  latitude?: number;
  longitude?: number;
  popup?: ReactElement;
  className?: string;
  onClick?: (e: MouseEvent, marker: RadarMarker) => void;
  zoom?: number;
}) {
  const { map } = useContext(mapContext);

  useEffect(() => {
    if (map == null) return;
    if (latitude == null || longitude == null) return;

    const container = popup ? document.createElement('div') : undefined;
    if (container != null && popup != null) {
      container.innerHTML = renderToStaticMarkup(popup);
    }

    const marker = Radar.ui
      .marker({
        popup: {
          element: container,
          maxWidth: '320px',
        },
      })
      .setLngLat([longitude, latitude])
      .addTo(map);

    if (className != null) {
      marker.getElement().classList.add(className);
    }

    const clickListener = (e: any) => {
      return onClick?.(e, marker);
    };

    marker.getElement().addEventListener('click', clickListener);

    map?.fitToMarkers({ animate: false });

    return () => {
      marker.remove();
    };
  }, [longitude, latitude, map, popup, className, onClick, zoom]);

  return null;
}
