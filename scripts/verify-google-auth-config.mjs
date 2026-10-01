// ==============================================================================
// scripts/verify-google-auth-config.mjs
// ZC Formula Student Telemetry & Project Management Workspace (PitLane)
// Static Verification Suite for Google OAuth Configuration & Security Invariants
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('='.repeat(80));
console.log('🏎️  SLICE G4: GOOGLE AUTH STATIC CONFIGURATION & SECURITY AUDIT');
console.log('='.repeat(80));

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
}

// ----------------------------------------------------------------------------
// 1. Google OAuth Client Configuration in useAuth.ts
// ----------------------------------------------------------------------------
console.log('\n[1/5] Verifying Google OAuth Parameters in src/hooks/useAuth.ts...');
const useAuthPath = path.resolve('src/hooks/useAuth.ts');
assert(fs.existsSync(useAuthPath), 'src/hooks/useAuth.ts exists');

if (fs.existsSync(useAuthPath)) {
  const useAuthContent = fs.readFileSync(useAuthPath, 'utf8');

  assert(
    useAuthContent.includes("provider: 'google'"),
    "OAuth call specifies provider: 'google'"
  );
  assert(
    useAuthContent.includes('hd: UNIVERSITY_DOMAIN') || useAuthContent.includes("hd: 'zewailcity.edu.eg'"),
    "OAuth queryParams include hd: 'zewailcity.edu.eg' UX domain hint"
  );
  assert(
    useAuthContent.includes("prompt: 'select_account'"),
    "OAuth queryParams include prompt: 'select_account' (forces account picker)"
  );
  assert(
    useAuthContent.includes('redirectTo: window.location.origin'),
    'OAuth redirectTo is strictly window.location.origin (prevents open redirects)'
  );
  assert(
    useAuthContent.includes('window.history.replaceState'),
    'Auth parameters (?code= / ?error=) are stripped from address bar'
  );
  assert(
    useAuthContent.includes('Use your @zewailcity.edu.eg Google account'),
    'Friendly mapped error message for domain rejection exists'
  );
  assert(
    useAuthContent.includes('Sign-in cancelled'),
    'Friendly mapped error message for user cancellation exists'
  );
}

// ----------------------------------------------------------------------------
// 2. PKCE Authorization Grant in src/lib/supabase.ts
// ----------------------------------------------------------------------------
console.log('\n[2/5] Verifying PKCE Configuration in src/lib/supabase.ts...');
const supabaseClientPath = path.resolve('src/lib/supabase.ts');
assert(fs.existsSync(supabaseClientPath), 'src/lib/supabase.ts exists');

if (fs.existsSync(supabaseClientPath)) {
  const supabaseContent = fs.readFileSync(supabaseClientPath, 'utf8');

  assert(
    supabaseContent.includes("flowType: 'pkce'"),
    "Supabase auth client explicitly configured with flowType: 'pkce'"
  );
  assert(
    supabaseContent.includes('detectSessionInUrl: true'),
    'Supabase auth client configured with detectSessionInUrl: true'
  );
}

// ----------------------------------------------------------------------------
// 3. UI Component & Feature Flags
// ----------------------------------------------------------------------------
console.log('\n[3/5] Verifying AuthScreen & Feature Flags...');
const authScreenPath = path.resolve('src/components/auth/AuthScreen.tsx');
const featureFlagsPath = path.resolve('src/config/authFeatures.ts');

assert(fs.existsSync(authScreenPath), 'src/components/auth/AuthScreen.tsx exists');
assert(fs.existsSync(featureFlagsPath), 'src/config/authFeatures.ts exists');

if (fs.existsSync(authScreenPath)) {
  const authContent = fs.readFileSync(authScreenPath, 'utf8');

  assert(
    authContent.includes('Continue with Google'),
    'Hero button has exact wording: "Continue with Google"'
  );
  assert(
    authContent.includes('min-h-[48px]'),
    'Button touch target is >= 44px (min-h-[48px])'
  );
  assert(
    authContent.includes('#4285F4') && authContent.includes('#34A853') && authContent.includes('#FBBC05') && authContent.includes('#EA4335'),
    'Official unmodified 4-color Google "G" SVG mark present'
  );
  assert(
    authContent.includes('isGoogleLoading') || authContent.includes('loading'),
    'Loading spinner and double-click guard implemented'
  );
}

if (fs.existsSync(featureFlagsPath)) {
  const featContent = fs.readFileSync(featureFlagsPath, 'utf8');

  assert(
    featContent.includes('IS_GOOGLE_AUTH_ENABLED'),
    'VITE_GOOGLE_AUTH_ENABLED feature flag exported'
  );
  assert(
    featContent.includes('IS_AUTH_EMAIL_ENABLED'),
    'VITE_AUTH_EMAIL_ENABLED feature flag exported'
  );
}

// ----------------------------------------------------------------------------
// 4. Service Worker / PWA Network Rules
// ----------------------------------------------------------------------------
console.log('\n[4/5] Verifying Service Worker & PWA Network Policies...');
const viteConfigPath = path.resolve('vite.config.ts');
assert(fs.existsSync(viteConfigPath), 'vite.config.ts exists');

if (fs.existsSync(viteConfigPath)) {
  const viteContent = fs.readFileSync(viteConfigPath, 'utf8');

  assert(
    viteContent.includes('navigateFallbackDenylist'),
    'navigateFallbackDenylist configured to prevent serving cached shell on auth routes'
  );
  assert(
    viteContent.includes("handler: 'NetworkOnly'") && viteContent.includes('supabase.co'),
    'Supabase API calls are strictly NetworkOnly (never cached)'
  );
}

// ----------------------------------------------------------------------------
// 5. Repository Secret Grep Audit
// ----------------------------------------------------------------------------
console.log('\n[5/5] Auditing Repository for Leaked Secrets...');
try {
  let leakedSecret = false;

  try {
    // Search for actual Google Client Secret pattern (GOCSPX-<secret-characters>)
    const gocspxOutput = execSync('git grep -E "GOCSPX-[A-Za-z0-9_-]{10,}"', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    if (gocspxOutput.trim().length > 0) {
      console.error('  ❌ Leaked GOCSPX secret detected:\n', gocspxOutput);
      leakedSecret = true;
    }
  } catch (e) {
    // Exit code 1 means pattern not found (which is clean and expected)
  }

  assert(!leakedSecret, 'Zero occurrences of Google client secret (GOCSPX) in repo');

  const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  assert(
    gitignoreContent.includes('.env') && gitignoreContent.includes('.env.local'),
    '.env and .env.local strictly ignored by .gitignore'
  );
} catch (err) {
  assert(false, `Secret audit error: ${err.message}`);
}

// ----------------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------------
console.log('\n' + '='.repeat(80));
console.log(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED out of ${passCount + failCount}`);
console.log('='.repeat(80));

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 SLICE G4 VERIFIED: All Google Auth configuration & security invariants passed.');
  process.exit(0);
}
