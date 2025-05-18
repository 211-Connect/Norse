import { Address } from '@/types/address';

export function getLocationQuery(
  locationSearchTerm: string,
  { addresses }: { addresses: Address[] },
): { location: string; coords: string; distance: number | null } {
  let address = addresses.find(
    (address) =>
      address.address.toLowerCase() === locationSearchTerm.toLowerCase(),
  );

  if (!address && addresses.length) {
    address = addresses[0];
  }

  return {
    location: address?.address || '',
    coords: address?.coordinates.join(',') || '',
    distance: !address ? null : 0,
  };
}
