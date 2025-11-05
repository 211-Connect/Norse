import { useEffect } from 'react';

export const DynamicHeightListener = () => {
  useEffect(() => {
    function fixVH() {
      const vh = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    window.visualViewport?.addEventListener('resize', fixVH);
    window.addEventListener('resize', fixVH);
    fixVH();

    return () => {
      window.visualViewport?.removeEventListener('resize', fixVH);
      window.removeEventListener('resize', fixVH);
    };
  }, []);
  return null;
};
