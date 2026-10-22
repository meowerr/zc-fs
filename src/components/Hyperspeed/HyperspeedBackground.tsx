'use client';

import React, { useEffect, useState, Suspense, lazy } from 'react';

const Hyperspeed = lazy(() => import('./Hyperspeed'));

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export default function HyperspeedBackground(): React.ReactElement | null {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallPhone, setIsSmallPhone] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
    setIsSmallPhone(window.innerWidth < 480);
    setReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    setWebglOk(supportsWebGL());

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmallPhone(window.innerWidth < 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted) return null;

  // Fallback: reduced motion, no WebGL, or small mobile device (<480px) —
  // show a lightweight CSS gradient instead of running 3D canvas shaders.
  if (reducedMotion || !webglOk || isSmallPhone) {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(255,106,0,0.08), transparent 60%), #05070a',
        }}
      />
    );
  }

  // Brand palette pulled from the ZFS logo: orange + white/silver on near-black
  const ORANGE = ['#ff6a00', '#ff8c3d', '#ffb37a'];
  const SILVER = ['#ffffff', '#e2e8f0', '#94a3b8'];

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10 pointer-events-none overflow-hidden"
    >
      <Suspense fallback={null}>
        <Hyperspeed
          curve="racing"
          curvature={isMobile ? 0.6 : 1.2}
          speed={0.8}
          boost={isMobile ? 1 : 2.2}
          fov={isMobile ? 88 : 100}
          boostFov={110}
          lanes={isMobile ? 2 : 3}
          roadWidth={10}
          medianWidth={2}
          density={isMobile ? 16 : 36}
          trailLength={1.1}
          lightSize={1}
          poles={isMobile ? 6 : 16}
          poleHeight={0.8}
          dust={isMobile ? 30 : 90}
          glow={0.55}
          reflections={0.35}
          roadOpacity={0.08}
          steer={0}              // no pointer-follow on a login screen
          interactive={false}    // IMPORTANT: prevents canvas from intercepting clicks on the card
          theme="dark"
          roadColor="#05070a"    // matches page background
          lineColor="#2a2a33"
          tailColors={ORANGE}
          headColors={SILVER}
          poleColors={ORANGE}
          background="transparent" // lets existing page bg show through
        />
      </Suspense>
    </div>
  );
}
