import { useMemo } from 'react';
import { getPublicConfig } from '@/pages/api/config';
import Map from './components/map';
import { useAppConfig } from '@/hooks/use-app-config';
import { Markers } from './components/map-markers';

export default function RadarMap(props) {
  const appConfig = useAppConfig();
  const RADAR_ACCESS_TOKEN = getPublicConfig('RADAR_ACCESS_TOKEN');

  const mapProps = useMemo(
    () => ({
      publishableKey: RADAR_ACCESS_TOKEN,
      center: appConfig?.features?.map?.center,
      zoom: 12,
    }),
    [RADAR_ACCESS_TOKEN, appConfig],
  );

  return (
    <Map {...mapProps} {...props}>
      <Markers results={props.results} />
    </Map>
  );
}
