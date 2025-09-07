'use client';

import { PropsWithChildren } from 'react';
import { TourProvider as TourProvideOrig } from '@reactour/tour';

export const TourProvider = ({ children }: PropsWithChildren) => {
  return (
    <TourProvideOrig steps={[]} scrollSmooth>
      {children}
    </TourProvideOrig>
  );
};
