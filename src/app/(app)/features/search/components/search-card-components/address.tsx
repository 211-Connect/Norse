'use client';

import { SearchCardComponentProps } from './types';
import { AddressComponent as ResourceAddressComponent } from '../../../resource/components/resource-components';

export function AddressComponent({ result }: SearchCardComponentProps) {
  return <ResourceAddressComponent resource={result} withIcon />;
}
