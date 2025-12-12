import { useEffect } from 'react';

export function useOnPointerDownOutside(
  ref: React.RefObject<HTMLElement>,
  handler: (event: PointerEvent) => void,
) {
  useEffect(() => {
    const listener = (event: PointerEvent) => {
      const el = ref?.current;
      if (!el || el.contains(event.target as Node)) return;
      handler(event);
    };

    document.addEventListener('touchstart', listener);
    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('touchstart', listener);
      document.removeEventListener('mousedown', listener);
    };
  }, [ref, handler]);
}
