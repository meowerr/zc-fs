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
    color_accent: '#FF6A00', // Racing Orange
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
  '#FF6A00', // Racing Orange
  '#FFD43B', // Racing Yellow
  '#10E57A', // Racing Lime
  '#C8CED6', // Chrome
  '#A855F7', // Cyber Purple
];

/**
 * Global Semantic Status Mapping
 * ACTIVE      → Racing Orange (#FF6A00)
 * PENDING     → Racing Yellow (#FFD43B)
 * SUCCESS     → Racing Lime   (#10E57A)
 * ERROR       → Racing Red    (#FF304F)
 * SYSTEM      → Electric Cyan (#00D9FF)
 * INACTIVE    → Chrome Muted  (#737D89)
 */
export const STATUS_SEMANTICS = {
  active: {
    label: 'ACTIVE',
    color: '#FF6A00',
    bgClass: 'bg-[#FF6A00]/15',
    textClass: 'text-[#FF6A00]',
    borderClass: 'border-[#FF6A00]/40',
    dotClass: 'bg-[#FF6A00] shadow-glow-orange',
  },
  pending: {
    label: 'PENDING',
    color: '#FFD43B',
    bgClass: 'bg-[#FFD43B]/15',
    textClass: 'text-[#FFD43B]',
    borderClass: 'border-[#FFD43B]/40',
    dotClass: 'bg-[#FFD43B] shadow-glow-yellow animate-pulse',
  },
  success: {
    label: 'APPROVED',
    color: '#10E57A',
    bgClass: 'bg-[#10E57A]/15',
    textClass: 'text-[#10E57A]',
    borderClass: 'border-[#10E57A]/40',
    dotClass: 'bg-[#10E57A] shadow-glow-lime',
  },
  error: {
    label: 'CRITICAL',
    color: '#FF304F',
    bgClass: 'bg-[#FF304F]/15',
    textClass: 'text-[#FF304F]',
    borderClass: 'border-[#FF304F]/40',
    dotClass: 'bg-[#FF304F] shadow-glow-red animate-pulse',
  },
  system: {
    label: 'SYSTEM',
    color: '#00D9FF',
    bgClass: 'bg-[#00D9FF]/15',
    textClass: 'text-[#00D9FF]',
    borderClass: 'border-[#00D9FF]/40',
    dotClass: 'bg-[#00D9FF] shadow-glow-cyan',
  },
  muted: {
    label: 'TODO',
    color: '#737D89',
    bgClass: 'bg-[#737D89]/15',
    textClass: 'text-cyber-muted',
    borderClass: 'border-cyber-border',
    dotClass: 'bg-[#737D89]',
  },
};
