import { useAppConfig } from '@/hooks/use-app-config';
import dynamic from 'next/dynamic';

export default function MapLoader(props) {
  const appConfig = useAppConfig();
  const mapAdapterName = appConfig.adapters.map;
  const MapComponent = dynamic(() =>
    import(`./${mapAdapterName}`).then((mod) => mod.default),
  );

  return <MapComponent {...props} />;
}
