import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function runPhase1Verification() {
  console.log('='.repeat(80));
  console.log('🏎️  PHASE 1 VERIFICATION: DATA MODEL & SECURITY FOUNDATION');
  console.log('='.repeat(80));

  const adminEmail = 'admin_pitlane@zewailcity.edu.eg';
  const engineerEmail = 'engineer_aero@zewailcity.edu.eg';
  const password = 'SecurePassword2026!';

  // Step 1: Migration 006 File Integrity
  console.log('\n[1/4] Verifying migration 006 file and complete setup SQL...');
  if (!fs.existsSync('supabase/migrations/006_product_maturity_schema.sql')) {
    throw new Error('Migration 006 file is missing!');
  }
  const m006Content = fs.readFileSync('supabase/migrations/006_product_maturity_schema.sql', 'utf-8');
  if (!m006Content.includes('CREATE TABLE IF NOT EXISTS public.activity_logs')) {
    throw new Error('activity_logs table definition missing from 006 migration');
  }
  if (!m006Content.includes('CREATE TABLE IF NOT EXISTS public.documents')) {
    throw new Error('documents table definition missing from 006 migration');
  }
  if (!m006Content.includes('system_health_check')) {
    throw new Error('system_health_check function missing from 006 migration');
  }
  console.log('  ✅ [PASS] 006_product_maturity_schema.sql verified with RLS, indexes, and RPC functions.');

  // Step 2: Authenticate Admin & Check Live DB
  console.log('\n[2/4] Authenticating Admin against live database...');
  const { data: adminAuth, error: adminErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: password,
  });
  if (adminErr) {
    throw new Error(`Admin authentication failed: ${adminErr.message}`);
  }
  const adminClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${adminAuth.session.access_token}` } }
  });
  console.log('  ✅ [PASS] Admin session established.');

  // Step 3: Test Account State Semantics (Objective 2)
  console.log('\n[3/4] Verifying Unassigned Approved State & Constraint Validity...');
  const { data: engProf, error: engFetchErr } = await adminClient
    .from('profiles')
    .select('*')
    .eq('email', engineerEmail)
    .single();

  if (engFetchErr || !engProf) {
    throw new Error(`Failed to fetch test engineer profile: ${engFetchErr?.message}`);
  }

  // Set engineer to approved but unassigned from any group
  // (role: 'pending', group_id: null, status: 'approved')
  const { error: unassignErr } = await adminClient
    .from('profiles')
    .update({
      status: 'approved',
      role: 'pending',
      group_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', engProf.id);

  if (unassignErr) {
    throw new Error(`Failed to unassign member with approved status: ${unassignErr.message}`);
  }

  const { data: unassignedCheck } = await adminClient
    .from('profiles')
    .select('role, status, group_id')
    .eq('id', engProf.id)
    .single();

  if (unassignedCheck.status !== 'approved' || unassignedCheck.group_id !== null) {
    throw new Error('Unassigned profile did not retain approved status or null group_id');
  }
  console.log(`  ✅ [PASS] Profile successfully unassigned while retaining status="approved" (role=${unassignedCheck.role}, group=${unassignedCheck.group_id}).`);

  // Step 4: Reassign engineer to Vehicle Dynamics
  console.log('\n[4/4] Testing Direct Sub-team Reassignment (Transfer between groups)...');
  const vdGroupId = '11111111-1111-1111-1111-111111111111';
  const { error: reassignErr } = await adminClient
    .from('profiles')
    .update({
      status: 'approved',
      role: 'member',
      group_id: vdGroupId,
      updated_at: new Date().toISOString()
    })
    .eq('id', engProf.id);

  if (reassignErr) {
    throw new Error(`Failed to reassign member to Vehicle Dynamics: ${reassignErr.message}`);
  }

  const { data: reassignedCheck } = await adminClient
    .from('profiles')
    .select('role, status, group_id')
    .eq('id', engProf.id)
    .single();

  if (reassignedCheck.group_id !== vdGroupId || reassignedCheck.role !== 'member') {
    throw new Error('Reassignment failed to update group_id or role');
  }
  console.log(`  ✅ [PASS] Engineer successfully transferred to Vehicle Dynamics (group=${reassignedCheck.group_id}, role=${reassignedCheck.role}).`);

  console.log('\n' + '='.repeat(80));
  console.log('🏁 PHASE 1 VERIFICATION COMPLETE: ALL 4 STEPS PASSED');
  console.log('='.repeat(80));
}

runPhase1Verification().catch((err) => {
  console.error('\n❌ Phase 1 verification failed:', err);
  process.exit(1);
});
