import { useEffect, useRef, useState } from 'react';

export function usePullToRefresh(onRefresh?: () => Promise<void> | void) {
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);

  useEffect(() => {
    if (!onRefresh) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const onStart = (e: TouchEvent) => {
      if (
        window.scrollY === 0 &&
        !document.querySelector('[role="dialog"]') &&
        !document.querySelector('html[data-hide-mobile-nav="true"]')
      ) {
        startY.current = e.touches[0].clientY;
      }
    };

    const onEnd = async (e: TouchEvent) => {
      const diff = e.changedTouches[0].clientY - startY.current;
      if (window.scrollY === 0 && diff > 64) {
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
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, [onRefresh]);

  return isPulling;
}
