import dynamic from 'next/dynamic';

export const UpdateLocationModal: any = dynamic(
  () => import('./UpdateLocation').then((mod) => mod.UpdateLocation),
  { ssr: false }
);
