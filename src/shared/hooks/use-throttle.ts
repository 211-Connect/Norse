import { useCallback, useEffect, useRef, useState } from 'react';

export function useThrottle(callback, delay) {
  const timeoutRef = useRef(null);
  const lastRanRef = useRef(0);
  const callbackRef = useRef(callback);

  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clean up the timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args) => {
      const now = Date.now();

      if (now - lastRanRef.current >= delay) {
        callbackRef.current(...args);
        lastRanRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
          () => {
            callbackRef.current(...args);
            lastRanRef.current = Date.now();
          },
          delay - (now - lastRanRef.current),
        );
      }
    },
    [delay],
  );
}
