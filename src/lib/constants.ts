import { Group } from './database.types';

export const SUB_TEAMS: Group[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Technical - Vehicle Dynamics', slug: 'vehicle-dynamics', color_accent: '#2F6BFF', description: 'Suspension, chassis, brakes, tires, and kinematic simulation.', created_at: '' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Technical - Aerodynamics', slug: 'aerodynamics', color_accent: '#22E4F0', description: 'Wings, undertray, diffusers, CFD, and composite structures.', created_at: '' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Technical - Low-Voltage Electronics', slug: 'electronics', color_accent: '#FFC53D', description: 'Sensors, wiring harness, ECU, telemetry transmitters, and telemetry UI.', created_at: '' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Technical - Powertrain & Drivetrain', slug: 'powertrain', color_accent: '#FF4FA3', description: 'Engine/motor, differential, cooling, intake, exhaust, and battery management.', created_at: '' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Operations - Business, Cost & Marketing', slug: 'business-ops', color_accent: '#B6FF3B', description: 'Cost report, business presentation, sponsorship, branding, and logistics.', created_at: '' },
];

export const PRESET_COLORS = [
  '#2F6BFF', // Electric Blue
  '#22E4F0', // Aqua
  '#FFC53D', // Amber
  '#FF4FA3', // Hot Pink
  '#B6FF3B', // Lime
  '#A855F7', // Purple
  '#F97316', // Orange
];
