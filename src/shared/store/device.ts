import { atom } from 'jotai';

export const deviceAtom = atom({
  isMobile: false,
  isTablet: false,
  isDesktop: false,
});
