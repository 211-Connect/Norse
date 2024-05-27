import mapboxgl, {
  LngLatBounds,
  Map as MapType,
  Marker,
  Popup,
} from 'mapbox-gl';
import { useEffect, useMemo, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useAppConfig } from '@/hooks/use-app-config';
import { IconPhone, IconWorldWww } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTranslation } from 'next-i18next';
import { ReferralButton } from '@/components/referral-button';

type Props = {
  locations: {
    _id: string;
    name: string;
    description: string;
    website: string;
    phone: string;
    location?: {
      coordinates: [number, number];
    };
    serviceArea?: {
      extent: any;
    };
  }[];
};

const MAPBOX_STYLE_URL =
  'mapbox://styles/connect-211/ckuj22yvk7vsf18qxlz96blpg';
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_API_KEY as string;

export function MapComponent({ locations = [] }: Props) {
  const map = useRef<MapType>();
  const mapContainer = useRef<HTMLDivElement>(null);
  const outerContainer = useRef<HTMLDivElement>(null);
  const markers = useRef<Marker[]>([]);
  const router = useRouter();
  const { t } = useTranslation('common');
  const appConfig = useAppConfig();
  const mapConfig = useMemo(() => {
    const config: unknown = appConfig?.plugins?.find(
      (el: any) => el[0] === 'mapbox'
    )?.[1];

    return (config as { center: [number, number] }) ?? { center: [0, 0] };
  }, [appConfig.plugins]);

  useEffect(() => {
    map.current = new mapboxgl.Map({
      container: mapContainer.current as HTMLDivElement, // container ID or element
      style: MAPBOX_STYLE_URL, // style URL
      zoom: 7, // starting zoom
      center: [mapConfig.center[0], mapConfig.center[1]],
      accessToken: MAPBOX_ACCESS_TOKEN,
      trackResize: true,
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapConfig.center]);

  useEffect(() => {
    if (!map.current) return;

    const bounds = new LngLatBounds();

    // remove all current markers
    markers.current.forEach((marker) => marker.remove());

    // add new markers to the map
    markers.current = locations
      .filter(
        (resource) =>
          resource.location &&
          resource.location.coordinates[0] != 0 &&
          resource.location.coordinates[1] != 0
      )
      .map((resource) => {
        const latLng = resource?.location?.coordinates ?? mapConfig.center;
        bounds.extend(latLng as [number, number]);

        const popup = new Popup({ offset: 25, maxWidth: '450px' }).setHTML(
          renderToStaticMarkup(
            <div className="flex flex-col gap-2">
              <h3 className="font-2xl font-semibold">{resource.name}</h3>
              <p className="font-xl">{resource.description}</p>

              <div className="flex gap-2">
                <ReferralButton
                  referralType="call_referral"
                  resourceId={resource._id}
                  resource={resource}
                  disabled={!resource.phone}
                  href={`tel:${resource.phone}`}
                  className="min-w-[130px] gap-1"
                >
                  <IconPhone className="size-4" />
                  {t('call_to_action.call')}
                </ReferralButton>

                <ReferralButton
                  referralType="website_referral"
                  resourceId={resource._id}
                  resource={resource}
                  disabled={!resource.website}
                  href={resource?.website ?? ''}
                  target="_blank"
                  className="min-w-[130px] gap-1"
                >
                  <IconWorldWww className="size-4" />
                  {t('call_to_action.view_website')}
                </ReferralButton>
              </div>
            </div>
          )
        );

        const marker = new Marker()
          .setLngLat(latLng as [number, number])
          .setPopup(popup);

        marker.getElement().classList.add('custom-marker');

        marker.getElement().addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const element = document.getElementById(resource._id);

          document
            .querySelectorAll('.outline')
            .forEach((elem) => elem.classList.remove('outline'));

          if (element) {
            element.classList.add('outline');
            element.scrollIntoView();
          }

          for (const marker of markers.current) {
            if (marker.getPopup().isOpen()) {
              marker.togglePopup();
            }
          }

          marker.togglePopup();
        });

        return marker.addTo(map.current as MapType);
      });

    if (!bounds.isEmpty()) {
      if (markers.current.length > 1) {
        map.current.fitBounds(bounds, { padding: 50 });
      } else {
        map.current.fitBounds(bounds, { padding: 50, zoom: 13 });
      }
    }
  }, [locations, router.query.coords, mapConfig.center, t]);

  useEffect(() => {
    if (!map.current) return;

    function addNewSource() {
      const serviceAreaSrc = map?.current?.getSource('serviceArea');
      if (serviceAreaSrc || locations.length > 1) return;
      locations.forEach((resource) => {
        if (resource?.serviceArea?.extent && map.current) {
          map.current.addSource('serviceArea', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: resource.serviceArea.extent,
            },
          });

          map.current.addLayer({
            id: 'outline',
            type: 'line',
            source: 'serviceArea',
            layout: {},
            paint: {
              // 'line-color': theme.colors.primary[theme.primaryShade as number],
              'line-width': 2,
            },
          });
        }
      });
    }

    map.current.on('load', addNewSource);
    return () => {
      map.current?.off('load', addNewSource);
    };
  }, [locations, mapConfig.center]);

  return (
    <div
      ref={outerContainer}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
}
