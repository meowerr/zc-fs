// ==============================================================================
// src/config/authFeatures.ts
// ZC Formula Student Telemetry & Project Management Workspace (PitLane)
// Feature Flags for Authentication Systems (Google OAuth & Email/Password)
// ==============================================================================

/**
 * Feature flag for Google OAuth Sign-in.
 * Defaults to TRUE unless explicitly set to 'false' in environment.
 */
export const IS_GOOGLE_AUTH_ENABLED =
  import.meta.env.VITE_GOOGLE_AUTH_ENABLED !== 'false';

/**
 * Feature flag for Email/Password Authentication.
 * Defaults to TRUE unless explicitly set to 'false' in environment.
 * Allows graceful phase-out of email/password after Google pilot.
 */
export const IS_AUTH_EMAIL_ENABLED =
  import.meta.env.VITE_AUTH_EMAIL_ENABLED !== 'false';
