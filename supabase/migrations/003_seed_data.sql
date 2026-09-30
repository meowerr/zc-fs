-- ==============================================================================
-- 003_seed_data.sql
-- ZC Formula Student Telemetry & Project Management Workspace (PitLane)
-- Seeds the 5 Official Sub-Teams, Default Channels, and Initial Data
-- ==============================================================================

-- 1. Insert the 5 Official Formula Student Sub-Teams
INSERT INTO groups (id, name, slug, description, color_accent) VALUES
('11111111-1111-1111-1111-111111111111', 'Technical - Vehicle Dynamics', 'vehicle-dynamics', 'Suspension geometry, steering, kinematics, brakes, tires, chassis integration.', '#2F6BFF'),
('22222222-2222-2222-2222-222222222222', 'Technical - Aerodynamics', 'aerodynamics', 'Front wing, rear wing, undertray/diffuser, sidepods, cooling airflow simulation.', '#22E4F0'),
('33333333-3333-3333-3333-333333333333', 'Technical - Low-Voltage Electronics', 'electronics', 'CAN bus, sensor telemetry, dashboard displays, wiring harness, safety shutdown.', '#FFC53D'),
('44444444-4444-4444-4444-444444444444', 'Technical - Powertrain & Drivetrain', 'powertrain', 'Internal combustion engine / electric motor, transmission, differential, cooling.', '#FF4FA3'),
('55555555-5555-5555-5555-555555555555', 'Operations - Business, Cost & Marketing', 'business-ops', 'Cost report (BOM), business presentation, sponsorship, branding, logistics.', '#B6FF3B')
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color_accent = EXCLUDED.color_accent;

-- 2. Insert Default Communication Channels
-- Group Channels
INSERT INTO channels (name, slug, channel_type, group_id, description) VALUES
('VD Telemetry & Comms', 'ch-vehicle-dynamics', 'group', '11111111-1111-1111-1111-111111111111', 'Vehicle Dynamics sub-team internal engineering discussions.'),
('Aero CFD & Flight', 'ch-aerodynamics', 'group', '22222222-2222-2222-2222-222222222222', 'Aerodynamics design, CFD simulations, and wing fabrication.'),
('Low-Voltage Systems', 'ch-electronics', 'group', '33333333-3333-3333-3333-333333333333', 'Wiring harness, sensors, CAN bus packet decoding.'),
('Powertrain & Torque', 'ch-powertrain', 'group', '44444444-4444-4444-4444-444444444444', 'Engine tuning, dyno runs, drivetrain CAD modeling.'),
('Operations & Sponsorship', 'ch-business-ops', 'group', '55555555-5555-5555-5555-555555555555', 'BOM cost accounting, sponsor presentations, team logistics.')
ON CONFLICT (slug) DO NOTHING;

-- Cross-Group & Club-Wide Channels
INSERT INTO channels (name, slug, channel_type, group_id, description) VALUES
('Pit Wall (Heads Only)', 'ch-pit-wall-heads', 'heads_only', NULL, 'Cross-group leadership coordination channel for Sub-team Heads and Club Admins.'),
('Mission Control (Announcements)', 'ch-announcements', 'announcements', NULL, 'Official club-wide announcements, competition deadlines, and general updates.')
ON CONFLICT (slug) DO NOTHING;
