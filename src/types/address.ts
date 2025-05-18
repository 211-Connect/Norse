export interface Address {
  type: 'coordinates' | 'invalid';
  address: string;
  coordinates: [number, number];
}
