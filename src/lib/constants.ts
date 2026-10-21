import { Group } from './database.types';

export const SUB_TEAMS: Group[] = [
  { 
    id: '11111111-1111-1111-1111-111111111111', 
    name: 'Technical - Vehicle Dynamics', 
    slug: 'vehicle-dynamics', 
    color_accent: '#00D9FF', // Electric Cyan
    description: 'Suspension, chassis, brakes, tires, and kinematic simulation.', 
    created_at: '' 
  },
  { 
    id: '22222222-2222-2222-2222-222222222222', 
    name: 'Technical - Aerodynamics', 
    slug: 'aerodynamics', 
    color_accent: '#FF304F', // Racing Red
    description: 'Wings, undertray, diffusers, CFD, and composite structures.', 
    created_at: '' 
  },
  { 
    id: '33333333-3333-3333-3333-333333333333', 
    name: 'Technical - Low-Voltage Electronics', 
    slug: 'electronics', 
    color_accent: '#A855F7', // Cyber Violet (re-mapped to prevent brand orange collision)
    description: 'Sensors, wiring harness, ECU, telemetry transmitters, and telemetry UI.', 
    created_at: '' 
  },
  { 
    id: '44444444-4444-4444-4444-444444444444', 
    name: 'Technical - Powertrain & Drivetrain', 
    slug: 'powertrain', 
    color_accent: '#FFD43B', // Racing Yellow
    description: 'Engine/motor, differential, cooling, intake, exhaust, and battery management.', 
    created_at: '' 
  },
  { 
    id: '55555555-5555-5555-5555-555555555555', 
    name: 'Operations - Business, Cost & Marketing', 
    slug: 'business-ops', 
    color_accent: '#10E57A', // Racing Lime
    description: 'Cost report, business presentation, sponsorship, branding, and logistics.', 
    created_at: '' 
  },
];

export const PRESET_COLORS = [
  '#00D9FF', // Electric Cyan
  '#FF304F', // Racing Red
  '#A855F7', // Cyber Violet
  '#FFD43B', // Racing Yellow
  '#10E57A', // Racing Lime
  '#C8CED6', // Chrome
  '#E07212', // ZFS Brand Orange
];

/**
 * Global Semantic Status Mapping (Zero Collision with Brand Orange)
 * IN PROGRESS → Electric Cyan  (#00D9FF)
 * REVIEW      → Cyber Violet   (#A855F7)
 * PENDING     → Racing Yellow  (#FFD43B)
 * SUCCESS     → Racing Lime    (#10E57A)
 * ERROR       → Racing Red     (#FF304F)
 * SYSTEM      → Electric Cyan  (#00D9FF)
 * BRAND       → ZFS Orange     (#E07212)
 * TODO        → Chrome Muted   (#737D89)
 */
export const STATUS_SEMANTICS = {
  in_progress: {
    label: 'IN PROGRESS',
    color: '#00D9FF',
    bgClass: 'bg-accent-cyan/15',
    textClass: 'text-accent-cyan',
    borderClass: 'border-accent-cyan/40',
    dotClass: 'bg-accent-cyan shadow-[0_0_8px_rgba(0,217,255,0.4)]',
  },
  review: {
    label: 'IN REVIEW',
    color: '#A855F7',
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/40',
    dotClass: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)] animate-pulse',
  },
  pending: {
    label: 'PENDING',
    color: '#FFD43B',
    bgClass: 'bg-[#FFD43B]/15',
    textClass: 'text-[#FFD43B]',
    borderClass: 'border-[#FFD43B]/40',
    dotClass: 'bg-[#FFD43B] shadow-[0_0_8px_rgba(255,212,59,0.4)] animate-pulse',
  },
  success: {
    label: 'APPROVED',
    color: '#10E57A',
    bgClass: 'bg-[#10E57A]/15',
    textClass: 'text-[#10E57A]',
    borderClass: 'border-[#10E57A]/40',
    dotClass: 'bg-[#10E57A] shadow-[0_0_8px_rgba(16,229,122,0.4)]',
  },
  error: {
    label: 'CRITICAL',
    color: '#FF304F',
    bgClass: 'bg-[#FF304F]/15',
    textClass: 'text-[#FF304F]',
    borderClass: 'border-[#FF304F]/40',
    dotClass: 'bg-[#FF304F] shadow-[0_0_8px_rgba(255,48,79,0.5)] animate-pulse',
  },
  system: {
    label: 'SYSTEM',
    color: '#00D9FF',
    bgClass: 'bg-[#00D9FF]/15',
    textClass: 'text-[#00D9FF]',
    borderClass: 'border-[#00D9FF]/40',
    dotClass: 'bg-[#00D9FF] shadow-[0_0_8px_rgba(0,217,255,0.4)]',
  },
  brand: {
    label: 'ZFS IDENTITY',
    color: '#E07212',
    bgClass: 'bg-brand-orange/15',
    textClass: 'text-brand-orange',
    borderClass: 'border-brand-orange/40',
    dotClass: 'bg-brand-orange shadow-[0_0_8px_rgba(224,114,18,0.5)]',
  },
  muted: {
    label: 'TO DO',
    color: '#737D89',
    bgClass: 'bg-[#737D89]/15',
    textClass: 'text-cyber-muted',
    borderClass: 'border-cyber-border',
    dotClass: 'bg-[#737D89]',
  },
  // Backward compatibility alias for legacy active
  active: {
    label: 'IN PROGRESS',
    color: '#00D9FF',
    bgClass: 'bg-accent-cyan/15',
    textClass: 'text-accent-cyan',
    borderClass: 'border-accent-cyan/40',
    dotClass: 'bg-accent-cyan shadow-[0_0_8px_rgba(0,217,255,0.4)]',
  },
};

export const triggerHaptic = (ms = 8) => {
  try {
    if (
      typeof window !== 'undefined' &&
      'vibrate' in navigator &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      navigator.vibrate(ms);
    }
  } catch {}
};
