import React from 'react';

export interface HyperspeedProps {
  curve?: string;
  curvature?: number;
  speed?: number;
  boost?: number;
  fov?: number;
  boostFov?: number;
  lanes?: number;
  roadWidth?: number;
  medianWidth?: number;
  density?: number;
  trailLength?: number;
  lightSize?: number;
  poles?: number;
  poleHeight?: number;
  dust?: number;
  glow?: number;
  reflections?: number;
  roadOpacity?: number;
  steer?: number;
  interactive?: boolean;
  theme?: string;
  roadColor?: string;
  lineColor?: string;
  tailColors?: string[];
  headColors?: string[];
  poleColors?: string[];
  background?: string;
}

declare const Hyperspeed: React.ComponentType<HyperspeedProps>;
export default Hyperspeed;
