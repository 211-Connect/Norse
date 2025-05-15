import { useEffect, useState } from 'react';

export function useMouseMovement(enabled?: boolean) {
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let timeoutId;

    const handleMouseMove = () => {
      setIsMoving(true);

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMoving(false);
      }, 100);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, [enabled]);

  return isMoving;
}
