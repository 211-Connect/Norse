import { useMemo } from 'react';
import { type Style } from 'mapbox-gl';
import { getPublicConfig } from '@/pages/api/config';
import { useAppConfig } from '@/hooks/use-app-config';
import Map from './components/map';
import { Markers } from './components/map-markers';
import mapStyle from './style.json';

export default function MapboxMap(props) {
  const appConfig = useAppConfig();
  const MAPBOX_ACCESS_TOKEN = getPublicConfig('MAPBOX_ACCESS_TOKEN');

  const mapProps = useMemo(
    () => ({
      accessToken: MAPBOX_ACCESS_TOKEN,
      style: mapStyle as Style,
      center: appConfig?.features?.map?.center,
      zoom: 12,
      animate: false,
      boundsPadding: 50,
      ...props,
    }),
    [appConfig?.features?.map?.center, MAPBOX_ACCESS_TOKEN, props],
  );

  return (
    <Map {...mapProps}>
      <Markers results={props?.results ?? []} />
    </Map>
  );
}
