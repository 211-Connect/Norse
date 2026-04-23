'use client';

import { SearchCardComponentProps } from './types';
import { LocationNameComponent as ResourceLocationNameComponent } from '../../../resource/components/resource-components/location-name';

export function LocationNameComponent({ result }: SearchCardComponentProps) {
  return <ResourceLocationNameComponent resource={result} />;
}
