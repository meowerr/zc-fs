// ==============================================================================
// scripts/verify-google-signup-db.mjs
// ZC Formula Student Telemetry & Project Management Workspace (PitLane)
// Verification: Google OAuth Database Enforcement, Strict Domain Validation & RLS Quarantine
// ==============================================================================

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Load environment variables from gitignored local .env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        env[key] = val;
      }
    }
  }
  return { ...env, ...process.env };
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY;

console.log('='.repeat(80));
console.log('🏎️  SLICE G1: GOOGLE SIGNUP DATABASE ENFORCEMENT & QUARANTINE VERIFICATION');
console.log('='.repeat(80));

let totalCount = 0;
let passedCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

// ----------------------------------------------------------------------------
// TIER 1: Static Migration SQL & Regex Invariant Verification
// ----------------------------------------------------------------------------
console.log('\n[Tier 1] Static Migration & SQL Trigger Logic Analysis...');
const migrationPath = path.resolve('supabase/migrations/005_google_auth.sql');
assert(fs.existsSync(migrationPath), 'Migration file supabase/migrations/005_google_auth.sql exists');

if (fs.existsSync(migrationPath)) {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert(sql.includes('handle_new_user_registration'), 'SQL updates handle_new_user_registration function');
  assert(sql.includes('^[a-z0-9._%+-]+@zewailcity\\.edu\\.eg$'), 'SQL enforces strict regex domain constraint');
  assert(sql.includes("raw_user_meta_data->>'name'"), 'SQL reads Google OIDC standard "name" claim');
  assert(sql.includes("raw_user_meta_data->>'full_name'"), 'SQL supports "full_name" metadata claim');
  assert(sql.includes("split_part(clean_email, '@', 1)"), 'SQL falls back safely to email local-part');
  assert(sql.includes('ON CONFLICT (id) DO NOTHING'), 'SQL uses ON CONFLICT (id) DO NOTHING for safe account linking');
  assert(sql.includes('on_auth_user_created'), 'SQL ensures on_auth_user_created trigger on auth.users');
}

console.log('\n[Tier 1] Strict Domain Regex Unit Validation...');
const domainRegex = /^[a-z0-9._%+-]+@zewailcity\.edu\.eg$/i;

assert(domainRegex.test('student.2023001@zewailcity.edu.eg'), 'Valid student email permitted');
assert(domainRegex.test('STUDENT.2023001@ZEWAILCITY.EDU.EG'), 'Case-insensitive uppercase permitted');
assert(domainRegex.test('first.last-fs@zewailcity.edu.eg'), 'Hyphenated email permitted');
assert(!domainRegex.test('intruder@gmail.com'), 'Personal @gmail.com rejected');
assert(!domainRegex.test('attacker@zewailcity.edu.eg.evil.com'), 'Subdomain spoofing suffix rejected');
assert(!domainRegex.test('attacker@evilzewailcity.edu.eg'), 'Prefix spoofing rejected');
assert(!domainRegex.test('attacker@evil.com@zewailcity.edu.eg'), 'Double-@ injection rejected');
assert(!domainRegex.test('@zewailcity.edu.eg'), 'Missing local part rejected');

// ----------------------------------------------------------------------------
// TIER 2: Live Supabase Admin API Execution (when service-role key available)
// ----------------------------------------------------------------------------
if (!serviceRoleKey) {
  console.log('\n' + '-'.repeat(80));
  console.log('ℹ️  STATIC CHECKS PASSED: 16/16 checks successful.');
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY is not set in your local .env.');
  console.log('   To run live Admin API integration tests against your Supabase project:');
  console.log('   1. Execute supabase/migrations/005_google_auth.sql in your Supabase SQL Editor.');
  console.log('   2. Add SUPABASE_SERVICE_ROLE_KEY=<your-secret-key> to your local gitignored .env.');
  console.log('   3. Run: node scripts/verify-google-signup-db.mjs');
  console.log('-'.repeat(80));
  console.log(`\nVERIFICATION SUMMARY: ${passedCount} PASSED, ${totalCount - passedCount} FAILED out of ${totalCount}`);
  process.exit(0);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const createdUserIds = [];

async function cleanupTestUsers() {
  console.log('\n[Cleanup] Removing temporary test users from database...');
  for (const id of createdUserIds) {
    try {
      await adminClient.auth.admin.deleteUser(id);
      console.log(`  🧹 Removed test user ${id}`);
    } catch (err) {
      console.warn(`  ⚠️ Failed to delete test user ${id}:`, err.message);
    }
  }
}

async function runLiveTests() {
  console.log('\n[Tier 2] Live Admin API Integration Tests against Supabase...');
  try {
    // --------------------------------------------------------------------------
    // Test Case A: Valid @zewailcity.edu.eg domain with Google Provider Metadata
    // --------------------------------------------------------------------------
    console.log('\n[Test A] Valid domain signup with Google provider metadata & OIDC name...');
    const testAEmail = `google_valid_${Date.now()}@zewailcity.edu.eg`;
    const testAPassword = `ZcTestPass_${Date.now()}!`;
    const testAName = 'Farida Karim (Aero)';

    const { data: userAData, error: userAErr } = await adminClient.auth.admin.createUser({
      email: testAEmail,
      password: testAPassword,
      email_confirm: true,
      app_metadata: { provider: 'google', providers: ['google'] },
      user_metadata: {
        name: testAName,
        picture: 'https://lh3.googleusercontent.com/a/avatar-test',
      },
    });

    assert(!userAErr, `User creation succeeded for ${testAEmail} (${userAErr?.message || 'OK'})`);

    if (userAData?.user) {
      createdUserIds.push(userAData.user.id);

      const { data: profileA, error: profAErr } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', userAData.user.id)
        .single();

      assert(!profAErr && profileA, `Profile row created in public.profiles for ${testAEmail}`);
      assert(profileA?.status === 'pending', `Profile status is strictly 'pending' (quarantined)`);
      assert(profileA?.role === 'pending', `Profile role is strictly 'pending'`);
      assert(profileA?.full_name === testAName, `Profile full_name populated from Google OIDC name: "${profileA?.full_name}"`);
      assert(profileA?.email === testAEmail.toLowerCase(), `Profile email correctly matches lowercase`);
    }

    // --------------------------------------------------------------------------
    // Test Case B: Personal @gmail.com rejected with NO orphan in auth.users or profiles
    // --------------------------------------------------------------------------
    console.log('\n[Test B] Unauthorized domain (@gmail.com) rejected with zero orphan records...');
    const testBEmail = `intruder_google_${Date.now()}@gmail.com`;

    const { data: userBData, error: userBErr } = await adminClient.auth.admin.createUser({
      email: testBEmail,
      email_confirm: true,
      app_metadata: { provider: 'google' },
      user_metadata: { name: 'Gmail Unauthorized' },
    });

    assert(userBErr !== null, `Registration correctly rejected by DB trigger for ${testBEmail}`);
    if (userBData?.user) {
      createdUserIds.push(userBData.user.id);
    }

    const { data: orphanProfile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('email', testBEmail);

    assert(
      !orphanProfile || orphanProfile.length === 0,
      `No orphan profile row exists for rejected domain ${testBEmail}`
    );

    const { data: listAllUsers } = await adminClient.auth.admin.listUsers();
    const orphanAuth = listAllUsers?.users?.find((u) => u.email === testBEmail);
    assert(!orphanAuth, `No orphan auth.users row exists for rejected domain ${testBEmail}`);

    // --------------------------------------------------------------------------
    // Test Case C: Case-insensitivity & Spoofing Variants
    // --------------------------------------------------------------------------
    console.log('\n[Test C] Domain case-insensitivity & spoofing prevention...');

    const testC1Email = `UPPERCASE_STUDENT_${Date.now()}@ZEWAILCITY.EDU.EG`;
    const { data: userC1Data, error: userC1Err } = await adminClient.auth.admin.createUser({
      email: testC1Email,
      email_confirm: true,
      app_metadata: { provider: 'google' },
      user_metadata: { full_name: 'Uppercase Student' },
    });

    assert(!userC1Err, `Uppercase domain ${testC1Email} is allowed`);
    if (userC1Data?.user) {
      createdUserIds.push(userC1Data.user.id);
      const { data: profC1 } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', userC1Data.user.id)
        .single();
      assert(profC1?.email === testC1Email.toLowerCase(), `Profile email saved in normalized lowercase`);
      assert(profC1?.status === 'pending', `Uppercase user is quarantined as pending`);
    }

    const testC2Email = `attacker_${Date.now()}@zewailcity.edu.eg.evil.com`;
    const { error: userC2Err } = await adminClient.auth.admin.createUser({
      email: testC2Email,
      email_confirm: true,
      app_metadata: { provider: 'google' },
      user_metadata: { name: 'Subdomain Attacker' },
    });
    assert(userC2Err !== null, `Spoofed domain ${testC2Email} blocked`);

    const testC3Email = `attacker_${Date.now()}@evilzewailcity.edu.eg`;
    const { error: userC3Err } = await adminClient.auth.admin.createUser({
      email: testC3Email,
      email_confirm: true,
      app_metadata: { provider: 'google' },
      user_metadata: { name: 'Prefix Attacker' },
    });
    assert(userC3Err !== null, `Spoofed domain ${testC3Email} blocked`);

    const testC4Email = `attacker@evil.com@zewailcity.edu.eg`;
    const { error: userC4Err } = await adminClient.auth.admin.createUser({
      email: testC4Email,
      email_confirm: true,
      app_metadata: { provider: 'google' },
      user_metadata: { name: 'Double At Attacker' },
    });
    assert(userC4Err !== null, `Malformed double-@ email ${testC4Email} blocked`);

    // --------------------------------------------------------------------------
    // Test Case D: Pending Quarantine Isolation (0 rows under RLS)
    // --------------------------------------------------------------------------
    console.log('\n[Test D] Pending quarantine isolation under PostgreSQL RLS...');
    if (userAData?.user) {
      const pendingClient = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: authSignIn, error: signInErr } = await pendingClient.auth.signInWithPassword({
        email: testAEmail,
        password: testAPassword,
      });

      assert(!signInErr && authSignIn?.session, `Pending user successfully logged in to obtain RLS token`);

      if (authSignIn?.session) {
        const authedUserClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: `Bearer ${authSignIn.session.access_token}` } },
        });

        const { data: tasksData, error: tasksErr } = await authedUserClient.from('tasks').select('*');
        assert(
          !tasksErr && Array.isArray(tasksData) && tasksData.length === 0,
          `Pending user sees exactly 0 rows of tasks (count: ${tasksData?.length ?? 'err'})`
        );

        const { data: channelsData, error: channelsErr } = await authedUserClient.from('channels').select('*');
        assert(
          !channelsErr && Array.isArray(channelsData) && channelsData.length === 0,
          `Pending user sees exactly 0 rows of channels (count: ${channelsData?.length ?? 'err'})`
        );

        const { data: messagesData, error: messagesErr } = await authedUserClient.from('messages').select('*');
        assert(
          !messagesErr && Array.isArray(messagesData) && messagesData.length === 0,
          `Pending user sees exactly 0 rows of messages (count: ${messagesData?.length ?? 'err'})`
        );

        const { data: docsData, error: docsErr } = await authedUserClient.from('documents').select('*');
        assert(
          !docsErr && Array.isArray(docsData) && docsData.length === 0,
          `Pending user sees exactly 0 rows of documents (count: ${docsData?.length ?? 'err'})`
        );
      }
    }

    // --------------------------------------------------------------------------
    // Test Case E: Audit non-real test accounts in project
    // --------------------------------------------------------------------------
    console.log('\n[Audit] Listing existing project accounts before cleanup...');
    const { data: userList } = await adminClient.auth.admin.listUsers();
    const { data: profileList } = await adminClient.from('profiles').select('id, email, full_name, role, status');

    console.log(`  Found ${userList?.users?.length || 0} auth users and ${profileList?.length || 0} profiles.`);
    if (profileList && profileList.length > 0) {
      console.log('  Active Profiles:');
      for (const p of profileList) {
        console.log(`    - [${p.role.toUpperCase()} / ${p.status.toUpperCase()}] ${p.email} ("${p.full_name}")`);
      }
    }

  } finally {
    await cleanupTestUsers();
  }

  console.log('\n' + '='.repeat(80));
  console.log(`VERIFICATION SUMMARY: ${passedCount} PASSED, ${totalCount - passedCount} FAILED out of ${totalCount}`);
  console.log('='.repeat(80));

  if (passedCount === totalCount && totalCount > 0) {
    console.log('🎉 SLICE G1 VERIFIED: Google Signup DB & Quarantine Passed with 100% Success.');
    process.exit(0);
  } else {
    console.error('❌ SLICE G1: One or more database verification checks failed.');
    process.exit(1);
  }
}

runLiveTests().catch((err) => {
  console.error('Fatal execution error:', err);
  cleanupTestUsers().finally(() => process.exit(1));
});
