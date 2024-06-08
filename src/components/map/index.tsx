import { useAppConfig } from '@/hooks/use-app-config';
import { ISearchResult } from '@/types/search-result';
import { LngLatLike } from 'maplibre-gl';
import dynamic from 'next/dynamic';
import { memo } from 'react';

interface IMapLoaderProps {
  results?: ISearchResult[];
  center?: LngLatLike;
  zoom?: number;
  animate?: boolean;
  boundsPadding?: number;
  boundsZoom?: number;
}

const MapLoader = memo<IMapLoaderProps>(function MemoizedMapLoader(props) {
  const appConfig = useAppConfig();
  const mapAdapterName = appConfig.adapters.map;
  const MapComponent = dynamic<IMapLoaderProps>(() =>
    import(`./${mapAdapterName}`).then((mod) => mod.default),
  );

  return <MapComponent {...props} />;
});

export default MapLoader;
