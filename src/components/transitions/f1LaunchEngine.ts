/**
 * F1 Launch Animation Engine
 * 
 * Pure Canvas 2D rendering engine for a cinematic F1 car launch transition.
 * The car starts small/far away and races directly toward the viewer with:
 *   - Nonlinear acceleration (slow → anticipation → explosive → impact)
 *   - Perspective scaling (small → massive)
 *   - Motion blur trails
 *   - Speed lines converging to center
 *   - Radial blur / chromatic aberration
 *   - Camera shake
 *   - Particle sparks
 *   - Screen flash at impact
 *   - Optional synthesized engine rev sound
 * 
 * Zero external dependencies. ~8KB gzipped.
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export type QualityTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';

export interface LaunchConfig {
  /** Total animation duration in ms (default: 1800) */
  duration?: number;
  /** Quality tier for rendering (default: auto-detected) */
  quality?: QualityTier;
  /** Whether to play synthesized engine sound (default: true) */
  enableSound?: boolean;
  /** Called when animation completes */
  onComplete: () => void;
  /** Called if animation errors (never blocks auth) */
  onError?: (err: Error) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface SpeedLine {
  angle: number;
  length: number;
  speed: number;
  offset: number;
  width: number;
  opacity: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const COLORS = {
  blue: '#2F6BFF',
  aqua: '#22E4F0',
  pink: '#FF4FA3',
  white: '#E8F0FF',
  darkBg: '#060B1A',
  trackGrey: '#1a2040',
};

// ─── Quality Detection ────────────────────────────────────────────────────

function detectQuality(): QualityTier {
  if (typeof window === 'undefined') return 'MINIMAL';
  
  // Check reduced motion preference
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return 'MINIMAL';
  }

  // Check device memory (Chrome)
  const nav = navigator as any;
  if (nav.deviceMemory && nav.deviceMemory < 4) return 'LOW';
  
  // Check hardware concurrency
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return 'LOW';
  
  // Mobile detection (rough)
  const isMobile = window.innerWidth < 768;
  if (isMobile) return 'MEDIUM';

  return 'HIGH';
}

// ─── Easing Functions ─────────────────────────────────────────────────────

/** Slow start → explosive acceleration (custom power curve) */
function launchEasing(t: number): number {
  // Phase 1 (0-0.3): Very slow anticipation buildup
  // Phase 2 (0.3-0.7): Explosive exponential acceleration
  // Phase 3 (0.7-1.0): Screaming flyby
  if (t < 0.3) {
    // Gentle cubic ease-in
    const p = t / 0.3;
    return p * p * p * 0.05;
  } else if (t < 0.7) {
    // Explosive power curve
    const p = (t - 0.3) / 0.4;
    return 0.05 + p * p * p * p * 0.55;
  } else {
    // Final rush to impact
    const p = (t - 0.7) / 0.3;
    return 0.6 + p * p * 0.4;
  }
}

/** Camera shake intensity curve (peaks near impact) */
function shakeIntensity(t: number): number {
  if (t < 0.4) return 0;
  if (t < 0.85) return ((t - 0.4) / 0.45) * 8;
  return 8 + ((t - 0.85) / 0.15) * 16; // Peak shake at impact
}

// ─── Engine Sound Synthesizer ─────────────────────────────────────────────

function createEngineSound(ctx: AudioContext, duration: number): () => void {
  const now = ctx.currentTime;
  const end = now + duration / 1000;

  // Master gain
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.06, now + 0.3);
  master.gain.exponentialRampToValueAtTime(0.12, end - 0.2);
  master.gain.linearRampToValueAtTime(0, end);
  master.connect(ctx.destination);

  // Low rumble (engine base)
  const bassOsc = ctx.createOscillator();
  bassOsc.type = 'sawtooth';
  bassOsc.frequency.setValueAtTime(80, now);
  bassOsc.frequency.exponentialRampToValueAtTime(200, now + duration * 0.3 / 1000);
  bassOsc.frequency.exponentialRampToValueAtTime(600, end - 0.1);
  const bassGain = ctx.createGain();
  bassGain.gain.setValueAtTime(0.5, now);
  bassOsc.connect(bassGain);
  bassGain.connect(master);
  bassOsc.start(now);
  bassOsc.stop(end);

  // High whine (turbo)
  const highOsc = ctx.createOscillator();
  highOsc.type = 'sine';
  highOsc.frequency.setValueAtTime(400, now);
  highOsc.frequency.exponentialRampToValueAtTime(2400, end - 0.05);
  const highGain = ctx.createGain();
  highGain.gain.setValueAtTime(0.1, now);
  highGain.gain.linearRampToValueAtTime(0.35, end - 0.3);
  highGain.gain.linearRampToValueAtTime(0, end);
  highOsc.connect(highGain);
  highGain.connect(master);
  highOsc.start(now);
  highOsc.stop(end);

  // Doppler flyby whoosh at end
  const whoosh = ctx.createOscillator();
  whoosh.type = 'triangle';
  whoosh.frequency.setValueAtTime(1200, end - 0.15);
  whoosh.frequency.exponentialRampToValueAtTime(200, end);
  const whooshGain = ctx.createGain();
  whooshGain.gain.setValueAtTime(0, end - 0.2);
  whooshGain.gain.linearRampToValueAtTime(0.3, end - 0.08);
  whooshGain.gain.linearRampToValueAtTime(0, end);
  whoosh.connect(whooshGain);
  whooshGain.connect(master);
  whoosh.start(end - 0.2);
  whoosh.stop(end);

  return () => {
    try {
      bassOsc.stop();
      highOsc.stop();
      whoosh.stop();
      master.disconnect();
    } catch { /* Already stopped */ }
  };
}

// ─── Main Animation Engine ───────────────────────────────────────────────

export function runF1Launch(
  canvas: HTMLCanvasElement,
  carImage: HTMLImageElement,
  config: LaunchConfig
): () => void {
  const {
    duration = 1800,
    quality = detectQuality(),
    enableSound = true,
    onComplete,
    onError,
  } = config;

  // MINIMAL = reduced motion: skip animation entirely
  if (quality === 'MINIMAL') {
    onComplete();
    return () => {};
  }

  const maybeCtx = canvas.getContext('2d', { alpha: false });
  if (!maybeCtx) {
    onComplete();
    return () => {};
  }
  const ctx = maybeCtx; // Narrowed: CanvasRenderingContext2D (not null)

  // Sizing
  const dpr = quality === 'HIGH' ? Math.min(window.devicePixelRatio, 2) : 1;
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const cx = W / 2;
  const cy = H / 2;

  // Quality-dependent config
  const particleCount = quality === 'HIGH' ? 80 : quality === 'MEDIUM' ? 40 : 15;
  const speedLineCount = quality === 'HIGH' ? 40 : quality === 'MEDIUM' ? 24 : 12;
  const enableMotionBlur = quality !== 'LOW';
  const enableChromaticAberration = quality === 'HIGH';

  // ─── Initialize particles ─────────────────────────────────────────────
  const particles: Particle[] = [];
  const sparkColors = [COLORS.aqua, COLORS.blue, COLORS.pink, COLORS.white, '#FFD700'];

  function spawnParticle(progress: number) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 20 + Math.random() * 60;
    particles.push({
      x: cx + Math.cos(angle) * radius * (0.5 + progress),
      y: cy + Math.sin(angle) * radius * (0.5 + progress),
      vx: Math.cos(angle) * (2 + Math.random() * 6) * (1 + progress * 3),
      vy: Math.sin(angle) * (2 + Math.random() * 6) * (1 + progress * 3),
      life: 1,
      maxLife: 0.3 + Math.random() * 0.5,
      size: 1 + Math.random() * 3,
      color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
    });
  }

  // ─── Initialize speed lines ──────────────────────────────────────────
  const speedLines: SpeedLine[] = [];
  for (let i = 0; i < speedLineCount; i++) {
    speedLines.push({
      angle: (Math.PI * 2 * i) / speedLineCount + (Math.random() - 0.5) * 0.2,
      length: 50 + Math.random() * 150,
      speed: 0.5 + Math.random() * 2,
      offset: Math.random() * 300,
      width: 0.5 + Math.random() * 2,
      opacity: 0.2 + Math.random() * 0.4,
    });
  }

  // ─── Sound ──────────────────────────────────────────────────────────
  let stopSound: (() => void) | null = null;
  if (enableSound) {
    try {
      const isMuted = localStorage.getItem('zcfs_audio_muted') === 'true';
      if (!isMuted) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          if (audioCtx.state === 'suspended') audioCtx.resume();
          stopSound = createEngineSound(audioCtx, duration);
        }
      }
    } catch {
      // Audio not available — continue silently
    }
  }

  // ─── Animation Loop ─────────────────────────────────────────────────
  let animId: number;
  let startTime: number | null = null;
  let cancelled = false;

  function frame(timestamp: number) {
    if (cancelled) return;

    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const rawProgress = Math.min(elapsed / duration, 1);
    const progress = launchEasing(rawProgress);

    // ─── Camera shake ──────────────────────────────────────────────
    const shake = shakeIntensity(rawProgress);
    const shakeX = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const shakeY = shake > 0 ? (Math.random() - 0.5) * shake : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // ─── Background ────────────────────────────────────────────────
    // Dark racing-themed background with subtle vignette
    ctx.fillStyle = COLORS.darkBg;
    ctx.fillRect(-10, -10, W + 20, H + 20);

    // Track surface hint (ground plane, fades as car approaches)
    if (rawProgress < 0.85) {
      const trackAlpha = Math.max(0, 0.3 - progress * 0.4);
      ctx.save();
      ctx.globalAlpha = trackAlpha;
      // Perspective grid lines converging to center
      ctx.strokeStyle = COLORS.trackGrey;
      ctx.lineWidth = 1;
      for (let i = -6; i <= 6; i++) {
        ctx.beginPath();
        const spread = i * 80;
        ctx.moveTo(cx + spread * 3, H);
        ctx.lineTo(cx + spread * 0.1, cy - 100);
        ctx.stroke();
      }
      // Horizontal lines
      for (let j = 0; j < 8; j++) {
        const yPos = cy + (H - cy) * (j / 8) * (j / 8);
        const width = 40 + (j / 8) * W * 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - width / 2, yPos);
        ctx.lineTo(cx + width / 2, yPos);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ─── Speed Lines ───────────────────────────────────────────────
    if (rawProgress > 0.2) {
      const lineProgress = Math.min(1, (rawProgress - 0.2) / 0.6);
      ctx.save();
      speedLines.forEach((line) => {
        const alpha = line.opacity * lineProgress * (0.3 + progress * 0.7);
        ctx.globalAlpha = Math.min(alpha, 0.7);
        
        const innerR = 30 + (1 - progress) * 200 + line.offset * (1 - lineProgress);
        const outerR = innerR + line.length * (0.5 + progress * 2);
        
        const gradient = ctx.createLinearGradient(
          cx + Math.cos(line.angle) * innerR,
          cy + Math.sin(line.angle) * innerR,
          cx + Math.cos(line.angle) * outerR,
          cy + Math.sin(line.angle) * outerR
        );
        gradient.addColorStop(0, 'rgba(34, 228, 240, 0)');
        gradient.addColorStop(0.3, rawProgress > 0.7 ? COLORS.white : COLORS.aqua);
        gradient.addColorStop(1, 'rgba(47, 107, 255, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = line.width * (1 + progress);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(line.angle) * innerR, cy + Math.sin(line.angle) * innerR);
        ctx.lineTo(cx + Math.cos(line.angle) * outerR, cy + Math.sin(line.angle) * outerR);
        ctx.stroke();
      });
      ctx.restore();
    }

    // ─── F1 Car ────────────────────────────────────────────────────
    // Scale: starts at ~0.08 (far away) → ends at ~6.0 (massive closeup)
    const minScale = 0.06;
    const maxScale = 7.0;
    const carScale = minScale + progress * (maxScale - minScale);

    const carW = carImage.naturalWidth * carScale;
    const carH = carImage.naturalHeight * carScale;
    const carX = cx - carW / 2;
    // Car starts above center (far away on track) and drops to center as it approaches
    const carYOffset = (1 - progress) * H * 0.15;
    const carY = cy - carH / 2 - carYOffset;

    // Motion blur trails (ghosting)
    if (enableMotionBlur && rawProgress > 0.25 && rawProgress < 0.95) {
      const blurTrails = quality === 'HIGH' ? 4 : 2;
      for (let i = blurTrails; i >= 1; i--) {
        ctx.save();
        const trailProgress = Math.max(0, progress - i * 0.015);
        const trailScale = minScale + trailProgress * (maxScale - minScale);
        const tw = carImage.naturalWidth * trailScale;
        const th = carImage.naturalHeight * trailScale;
        const trailYOffset = (1 - trailProgress) * H * 0.15;
        ctx.globalAlpha = 0.15 / i;
        ctx.drawImage(carImage, cx - tw / 2, cy - th / 2 - trailYOffset, tw, th);
        ctx.restore();
      }
    }

    // Chromatic aberration (RGB split on the car)
    if (enableChromaticAberration && rawProgress > 0.5) {
      const aberration = (rawProgress - 0.5) * 8;
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.globalCompositeOperation = 'screen';
      // Red channel offset
      ctx.drawImage(carImage, carX - aberration, carY, carW, carH);
      // Blue channel offset
      ctx.drawImage(carImage, carX + aberration, carY, carW, carH);
      ctx.restore();
    }

    // Main car rendering
    ctx.save();
    if (rawProgress < 0.95) {
      ctx.globalAlpha = 1;
    } else {
      // Fade out at very end
      ctx.globalAlpha = Math.max(0, 1 - (rawProgress - 0.95) / 0.05);
    }
    ctx.drawImage(carImage, carX, carY, carW, carH);
    ctx.restore();

    // ─── Neon glow halo around car ─────────────────────────────────
    if (rawProgress > 0.3 && rawProgress < 0.92) {
      const glowAlpha = Math.min(0.4, (rawProgress - 0.3) * 0.8);
      const glowRadius = carW * 0.5;
      const gradient = ctx.createRadialGradient(cx, cy - carYOffset, 0, cx, cy - carYOffset, glowRadius);
      gradient.addColorStop(0, `rgba(34, 228, 240, ${glowAlpha})`);
      gradient.addColorStop(0.5, `rgba(47, 107, 255, ${glowAlpha * 0.3})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - glowRadius, cy - carYOffset - glowRadius, glowRadius * 2, glowRadius * 2);
      ctx.restore();
    }

    // ─── Particles (sparks/debris) ─────────────────────────────────
    if (rawProgress > 0.35) {
      // Spawn particles
      const spawnRate = Math.floor(particleCount * rawProgress * 0.15);
      for (let i = 0; i < spawnRate; i++) {
        if (particles.length < particleCount * 2) {
          spawnParticle(progress);
        }
      }
    }

    // Update and render particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life * 0.8;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ─── Radial blur overlay (tunnel vision) ──────────────────────
    if (rawProgress > 0.4) {
      const tunnelAlpha = Math.min(0.5, (rawProgress - 0.4) * 0.8);
      const gradient = ctx.createRadialGradient(cx, cy, W * 0.15, cx, cy, W * 0.7);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, `rgba(0, 0, 0, ${tunnelAlpha})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
    }

    // ─── Impact flash ─────────────────────────────────────────────
    if (rawProgress > 0.88) {
      const flashProgress = (rawProgress - 0.88) / 0.12;
      // White flash that peaks then fades
      let flashAlpha: number;
      if (flashProgress < 0.4) {
        flashAlpha = flashProgress / 0.4;
      } else {
        flashAlpha = 1;
      }
      ctx.save();
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(-10, -10, W + 20, H + 20);
      ctx.restore();
    }

    ctx.restore(); // End camera shake transform

    // ─── Continue or complete ──────────────────────────────────────
    if (rawProgress < 1) {
      animId = requestAnimationFrame(frame);
    } else {
      // Final white screen hold for 100ms then complete
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(0, 0, W, H);
      setTimeout(() => {
        if (!cancelled) {
          stopSound?.();
          onComplete();
        }
      }, 100);
    }
  }

  // ─── Hard timeout protection ─────────────────────────────────────
  const hardTimeout = setTimeout(() => {
    if (!cancelled) {
      console.warn('[F1Launch] Hard timeout reached, forcing completion');
      cancelled = true;
      cancelAnimationFrame(animId);
      stopSound?.();
      onComplete();
    }
  }, duration + 1000); // 1 second grace

  // Start
  try {
    animId = requestAnimationFrame(frame);
  } catch (err) {
    onError?.(err as Error);
    onComplete();
    return () => {};
  }

  // ─── Cleanup function ───────────────────────────────────────────
  return () => {
    cancelled = true;
    clearTimeout(hardTimeout);
    cancelAnimationFrame(animId);
    stopSound?.();
  };
}
