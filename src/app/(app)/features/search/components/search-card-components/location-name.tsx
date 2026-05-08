'use client';

import { LocationNameComponent as ResourceLocationNameComponent } from '../../../resource/components/resource-components/location-name';
import { SearchCardComponentProps } from './types';

export function LocationNameComponent({ result }: SearchCardComponentProps) {
  return <ResourceLocationNameComponent resource={result} />;
}
