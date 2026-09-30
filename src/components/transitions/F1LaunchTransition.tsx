/**
 * F1LaunchTransition
 * 
 * React component that renders a cinematic F1 car launch animation
 * between login success and dashboard reveal.
 * 
 * Features:
 * - Error isolation: animation failure NEVER blocks authentication
 * - Respects prefers-reduced-motion (instant skip)
 * - Hard timeout protection (never traps user)
 * - Lazy loads car image with fallback
 * - Adapts quality to device capability
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { runF1Launch } from './f1LaunchEngine';

interface F1LaunchTransitionProps {
  /** Set to true to trigger the animation */
  isActive: boolean;
  /** Called when animation completes (reveals dashboard) */
  onComplete: () => void;
}

const CAR_IMAGE_URL = '/assets/f1-car-front.jpg';

/** 
 * Detects if reduced motion is preferred. 
 * If so, we skip the entire animation. 
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export const F1LaunchTransition: React.FC<F1LaunchTransitionProps> = ({
  isActive,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'animating' | 'done'>('idle');

  const handleComplete = useCallback(() => {
    setPhase('done');
    // Small delay for the white flash to feel natural
    setTimeout(() => {
      onComplete();
    }, 50);
  }, [onComplete]);

  const handleError = useCallback((err: Error) => {
    console.error('[F1LaunchTransition] Animation error, skipping:', err);
    handleComplete();
  }, [handleComplete]);

  useEffect(() => {
    if (!isActive || phase !== 'idle') return;

    // Reduced motion: skip immediately
    if (prefersReducedMotion()) {
      console.log('[F1LaunchTransition] Reduced motion preferred, skipping animation');
      handleComplete();
      return;
    }

    setPhase('loading');

    // Load the car image
    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Hard timeout: if image doesn't load in 3 seconds, skip animation
    const loadTimeout = setTimeout(() => {
      console.warn('[F1LaunchTransition] Image load timeout, skipping animation');
      handleComplete();
    }, 3000);

    img.onload = () => {
      clearTimeout(loadTimeout);

      const canvas = canvasRef.current;
      if (!canvas) {
        handleComplete();
        return;
      }

      setPhase('animating');

      // Small delay to let React render the canvas at full size
      requestAnimationFrame(() => {
        try {
          cleanupRef.current = runF1Launch(canvas, img, {
            duration: 1800,
            enableSound: true,
            onComplete: handleComplete,
            onError: handleError,
          });
        } catch (err) {
          handleError(err as Error);
        }
      });
    };

    img.onerror = () => {
      clearTimeout(loadTimeout);
      console.warn('[F1LaunchTransition] Car image failed to load, skipping animation');
      handleComplete();
    };

    img.src = CAR_IMAGE_URL;

    return () => {
      clearTimeout(loadTimeout);
      cleanupRef.current?.();
    };
  }, [isActive, phase, handleComplete, handleError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  if (!isActive || phase === 'done') return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999]"
      style={{
        // Ensure it covers everything
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#060B1A',
      }}
      role="presentation"
      aria-hidden="true"
    >
      {/* Full viewport canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* Tap/click to skip (accessibility escape hatch) */}
      <button
        onClick={handleComplete}
        className="absolute bottom-8 right-8 px-4 py-2 text-xs font-mono uppercase 
                   text-white/40 hover:text-white/80 transition-colors cursor-pointer
                   bg-transparent border border-white/10 hover:border-white/30 rounded-lg
                   backdrop-blur-sm z-10"
        style={{ fontFamily: '"Share Tech Mono", monospace' }}
        aria-label="Skip animation"
      >
        Skip ▸
      </button>
    </div>
  );
};
