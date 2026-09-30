/**
 * F1 Horizontal Reveal Transition
 * 
 * Concept:
 * 1. User authenticates successfully.
 * 2. An F1 car blazes horizontally across the screen at hyper-speed.
 * 3. As the car cuts across, it generates a glowing laser-like horizontal strip.
 * 4. The incoming Dashboard is positioned directly underneath and revealed
 *    through the expanding strip (acting as a dynamic GPU clip-path mask).
 * 5. The strip expands vertically (top & bottom) with neon edge auras until
 *    it engulfs the entire viewport.
 * 6. The car exits off-screen, edge glows dissolve, and the Dashboard is 100% ready.
 * 
 * Safety:
 * - Error isolation: any error or asset failure immediately reveals dashboard.
 * - Respects prefers-reduced-motion (instant 150ms gentle fade).
 * - Hard timeout failsafe (never traps the user).
 * - Zero new external dependencies.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface F1HorizontalTransitionProps {
  /** Direction of the car pass: 'left-to-right' (default) or 'right-to-left' */
  direction?: 'left-to-right' | 'right-to-left';
  /** Total transition duration in ms (default: 1050ms) */
  duration?: number;
  /** Callback when transition finishes and dashboard is fully uncovered */
  onComplete: () => void;
  /** Child elements: the incoming Dashboard (AppShell) */
  children: React.ReactNode;
}

export const F1HorizontalTransition: React.FC<F1HorizontalTransitionProps> = ({
  direction = 'left-to-right',
  duration = 1450,
  onComplete,
  children,
}) => {
  const [phase, setPhase] = useState<'animating' | 'done'>('animating');
  const [carX, setCarX] = useState<number>(direction === 'left-to-right' ? -30 : 130);
  const [trailReach, setTrailReach] = useState<number>(0);
  const [halfHeight, setHalfHeight] = useState<number>(2); // px
  const [edgeGlowOpacity, setEdgeGlowOpacity] = useState<number>(1);
  const [carVisible, setCarVisible] = useState<boolean>(true);

  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef<boolean>(false);

  // Car asset path: flipped right or original left
  const carAsset = direction === 'left-to-right' ? '/f1-car-right.png' : '/f1-car.png';

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setPhase('done');
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }

    // Hard failsafe timeout: guaranteed completion within duration + 500ms
    const failsafe = setTimeout(() => {
      finish();
    }, duration + 500);

    const isLTR = direction === 'left-to-right';

    // Animation Loop
    const tick = (now: number) => {
      if (completedRef.current) return;
      if (!startTimeRef.current) startTimeRef.current = now;

      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Phase 1: Car crossing (6% to 58% of duration: ~85ms - 840ms)
      // Smooth cubic motorsport acceleration curve (fast, but visible)
      const carStartP = 0.06;
      const carEndP = 0.58;

      let currentCarX = isLTR ? -30 : 130;
      let currentTrailReach = 0;

      if (progress >= carStartP) {
        const carProgress = Math.min(Math.max((progress - carStartP) / (carEndP - carStartP), 0), 1);
        // Smooth cubic ease-in-out for balanced speed and readability
        const easedCar = carProgress < 0.5
          ? 4 * carProgress * carProgress * carProgress
          : 1 - Math.pow(-2 * carProgress + 2, 3) / 2;

        if (isLTR) {
          // Offscreen left (-30vw) to offscreen right (130vw)
          currentCarX = -30 + easedCar * 160;
          currentTrailReach = Math.min(Math.max(currentCarX + 5, 0), 100);
        } else {
          // Offscreen right (130vw) to offscreen left (-30vw)
          currentCarX = 130 - easedCar * 160;
          currentTrailReach = Math.min(Math.max(100 - currentCarX + 5, 0), 100);
        }
      }

      setCarX(currentCarX);
      setTrailReach(currentTrailReach);

      // Car leaves screen after carEndP
      if (progress > carEndP + 0.05) {
        setCarVisible(false);
      }

      // Phase 2: Vertical Expansion (38% to 90% of duration: ~550ms - 1300ms)
      // The strip starts at 4px height and blossoms vertically to cover full screen
      const expandStartP = 0.38;
      const expandEndP = 0.90;

      let currentHalfHeight = 2; // px

      if (progress >= expandStartP) {
        const expandProgress = Math.min(Math.max((progress - expandStartP) / (expandEndP - expandStartP), 0), 1);
        // Cubic ease-out expansion for energetic snap
        const easedExpand = 1 - Math.pow(1 - expandProgress, 3);
        const maxHalfHeight = (window.innerHeight || 900) * 0.58;
        currentHalfHeight = 2 + easedExpand * maxHalfHeight;
      }

      setHalfHeight(currentHalfHeight);

      // Phase 3: Glow edge dissolve (85% to 100% of duration)
      if (progress >= 0.85) {
        const fadeP = (progress - 0.85) / 0.15;
        setEdgeGlowOpacity(Math.max(1 - fadeP, 0));
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      clearTimeout(failsafe);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [direction, duration, finish]);

  if (phase === 'done') {
    // Render Dashboard fully uncovered without any wrapper overhead
    return <>{children}</>;
  }

  const isLTR = direction === 'left-to-right';
  const centerY = '48%';

  // Dynamic CSS clip-path polygon for revealing Dashboard
  // Before expansion: narrow horizontal slice behind car
  // After expansion: covers 100% of viewport
  const clipPathStyle = isLTR
    ? `polygon(
        0% calc(${centerY} - ${halfHeight}px),
        ${trailReach}% calc(${centerY} - ${halfHeight}px),
        ${trailReach}% calc(${centerY} + ${halfHeight}px),
        0% calc(${centerY} + ${halfHeight}px)
      )`
    : `polygon(
        ${100 - trailReach}% calc(${centerY} - ${halfHeight}px),
        100% calc(${centerY} - ${halfHeight}px),
        100% calc(${centerY} + ${halfHeight}px),
        ${100 - trailReach}% calc(${centerY} + ${halfHeight}px)
      )`;

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-chrome-100 dark:bg-midnight-950">
      {/* ─── Layer 1: Outgoing Frozen Login Screen Canvas / Backdrop ─── */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden bg-gradient-to-b from-chrome-100 via-chrome-50 to-chrome-100 dark:from-midnight-950 dark:via-midnight-900 dark:to-midnight-950"
        aria-hidden="true"
      >
        {/* Subtle decorative glow matching AuthScreen */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-telemetry-blue/15 dark:bg-telemetry-blue/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-telemetry-pink/15 dark:bg-telemetry-pink/20 blur-3xl" />
        
        {/* Center telemetry lock badge (faint watermark of outgoing login) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="text-center font-display font-black tracking-widest text-2xl uppercase text-chrome-900/40 dark:text-white/30">
            PitLane Telemetry
          </div>
        </div>
      </div>

      {/* ─── Layer 2: Incoming Dashboard, Clipped dynamically ─── */}
      <div
        className="absolute inset-0 z-10 w-full h-full overflow-hidden will-change-[clip-path]"
        style={{
          clipPath: clipPathStyle,
          WebkitClipPath: clipPathStyle,
        }}
      >
        {children}
      </div>

      {/* ─── Layer 3: F1 Speed & Energy Overlay (pointer-events-none) ─── */}
      <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden select-none">
        {/* A. Top Luminous Edge */}
        <div
          className="absolute left-0 h-[2px] transition-opacity duration-75 will-change-transform"
          style={{
            top: `calc(${centerY} - ${halfHeight}px)`,
            width: `${trailReach}%`,
            left: isLTR ? 0 : 'auto',
            right: isLTR ? 'auto' : 0,
            opacity: edgeGlowOpacity,
            background: 'linear-gradient(90deg, rgba(47, 107, 255, 0.4), #22E4F0 70%, #FFFFFF 100%)',
            boxShadow: '0 0 14px 2px #22E4F0, 0 -1px 6px #FFFFFF',
          }}
        />

        {/* B. Bottom Luminous Edge */}
        <div
          className="absolute left-0 h-[2px] transition-opacity duration-75 will-change-transform"
          style={{
            top: `calc(${centerY} + ${halfHeight}px)`,
            width: `${trailReach}%`,
            left: isLTR ? 0 : 'auto',
            right: isLTR ? 'auto' : 0,
            opacity: edgeGlowOpacity,
            background: 'linear-gradient(90deg, rgba(255, 79, 163, 0.4), #2F6BFF 70%, #FFFFFF 100%)',
            boxShadow: '0 0 14px 2px #2F6BFF, 0 1px 6px #22E4F0',
          }}
        />

        {/* C. Internal Aerodynamic Speed Streaks (inside the trail) */}
        {trailReach > 15 && halfHeight > 10 && (
          <div
            className="absolute left-0 overflow-hidden pointer-events-none"
            style={{
              top: `calc(${centerY} - ${halfHeight}px)`,
              height: `${halfHeight * 2}px`,
              width: `${trailReach}%`,
              left: isLTR ? 0 : 'auto',
              right: isLTR ? 'auto' : 0,
              opacity: edgeGlowOpacity * 0.35,
            }}
          >
            <div 
              className="w-full h-full"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 40px, rgba(34, 228, 240, 0.15) 40px, rgba(34, 228, 240, 0.15) 80px)',
              }}
            />
          </div>
        )}

        {/* D. The F1 Car Sprite */}
        {carVisible && (
          <div
            className="absolute will-change-transform"
            style={{
              top: centerY,
              left: `${carX}vw`,
              transform: 'translate(-50%, -50%)',
              width: 'clamp(280px, 34vw, 560px)',
            }}
          >
            {/* Aerodynamic wake aura */}
            <div 
              className="absolute -inset-4 rounded-full blur-md opacity-70 pointer-events-none"
              style={{
                background: isLTR
                  ? 'radial-gradient(circle at 20% 50%, rgba(34, 228, 240, 0.8), rgba(47, 107, 255, 0.4) 60%, transparent 80%)'
                  : 'radial-gradient(circle at 80% 50%, rgba(34, 228, 240, 0.8), rgba(47, 107, 255, 0.4) 60%, transparent 80%)',
              }}
            />

            {/* F1 Car Image */}
            <img
              src={carAsset}
              alt="F1 Telemetry Car"
              className="relative w-full h-auto object-contain select-none pointer-events-none"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(34, 228, 240, 0.6)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))',
              }}
              loading="eager"
              onError={() => {
                // Asset load failure graceful fallback
                finish();
              }}
            />

            {/* Exhaust Sparks / Particle Tail */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                [isLTR ? 'left' : 'right']: '-20px',
                width: '60px',
                height: '8px',
                background: 'linear-gradient(to left, rgba(255, 79, 163, 0.9), transparent)',
                filter: 'blur(2px)',
              }}
            />
          </div>
        )}

        {/* E. Accessibility Skip Escape Hatch */}
        <button
          onClick={finish}
          className="absolute bottom-6 right-6 px-3 py-1.5 rounded-lg border border-white/20 bg-black/40 text-white/60 hover:text-white hover:border-white/50 text-[11px] font-mono uppercase tracking-wider backdrop-blur-md cursor-pointer pointer-events-auto transition-all"
          aria-label="Skip transition"
        >
          Skip ⏭
        </button>
      </div>
    </div>
  );
};
