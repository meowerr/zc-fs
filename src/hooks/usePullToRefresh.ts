import { useEffect, useRef, useState } from 'react';

export function usePullToRefresh(onRefresh?: () => Promise<void> | void) {
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    if (!onRefresh) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const onStart = (e: TouchEvent) => {
      startY.current = null;
      if (
        window.scrollY <= 2 &&
        !document.querySelector('[role="dialog"]') &&
        !document.querySelector('html[data-hide-mobile-nav="true"]')
      ) {
        startY.current = e.touches[0].clientY;
      }
    };

    const onCancel = () => {
      startY.current = null;
    };

    const onEnd = async (e: TouchEvent) => {
      if (startY.current === null) return;
      const initialY = startY.current;
      startY.current = null;

      const diff = e.changedTouches[0].clientY - initialY;
      if (window.scrollY <= 2 && diff > 72) {
        setIsPulling(true);
        try {
          if (navigator.vibrate) {
            try { navigator.vibrate(8); } catch {}
          }
          await onRefresh();
        } finally {
          setIsPulling(false);
        }
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onCancel);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onCancel);
    };
  }, [onRefresh]);

  return isPulling;
}
