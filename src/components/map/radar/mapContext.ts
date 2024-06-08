import RadarMap from 'radar-sdk-js/dist/ui/RadarMap';
import { createContext } from 'react';

interface IMapContext {
  map?: RadarMap;
}

export const mapContext = createContext<IMapContext>({});
export const MapContextProvider = mapContext.Provider;
