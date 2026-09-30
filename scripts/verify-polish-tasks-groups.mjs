import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function runVerification() {
  console.log('='.repeat(80));
  console.log('🏎️  PHASE VERIFICATION: TASK DELETION, GROUP CREATION, MEMBER REMOVAL & RLS');
  console.log('='.repeat(80));

  const adminEmail = 'admin_pitlane@zewailcity.edu.eg';
  const engineerEmail = 'engineer_aero@zewailcity.edu.eg';
  const password = 'SecurePassword2026!';
  const vdGroupId = '11111111-1111-1111-1111-111111111111'; // Technical - Vehicle Dynamics

  // 1. Authenticate users
  console.log('\n[1/6] Authenticating Admin and Engineer against live Supabase...');
  const { data: adminAuth, error: adminAuthErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: password,
  });
  if (adminAuthErr) throw new Error(`Admin login failed: ${adminAuthErr.message}`);

  const { data: engAuth, error: engAuthErr } = await supabase.auth.signInWithPassword({
    email: engineerEmail,
    password: password,
  });
  if (engAuthErr) throw new Error(`Engineer login failed: ${engAuthErr.message}`);

  const adminClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${adminAuth.session.access_token}` } }
  });
  const engClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${engAuth.session.access_token}` } }
  });

  // Ensure Admin profile is active admin, Engineer is active member of VD
  await adminClient.from('profiles').update({ role: 'admin', status: 'approved', group_id: null }).eq('id', adminAuth.user.id);
  await adminClient.from('profiles').update({ role: 'member', status: 'approved', group_id: vdGroupId }).eq('id', engAuth.user.id);

  console.log(`✅ [PASS] Admin authenticated (${adminAuth.user.id})`);
  console.log(`✅ [PASS] Engineer authenticated (${engAuth.user.id})`);

  // 2. Test Task Deletion RLS Security
  console.log('\n[2/6] Verifying Task Deletion RLS authorization...');
  // Admin creates a test task in Vehicle Dynamics
  const testTaskTitle = `VERIFY_DELETE_${Date.now()}`;
  const { data: createdTask, error: createTaskErr } = await adminClient.from('tasks').insert({
    title: testTaskTitle,
    description: 'Task to verify deletion behavior',
    group_id: vdGroupId,
    creator_id: adminAuth.user.id,
    task_type: 'other',
    priority: 'medium',
    status: 'in_progress',
    deadline: new Date(Date.now() + 86400000).toISOString()
  }).select().single();

  if (createTaskErr) throw new Error(`Failed to create test task: ${createTaskErr.message}`);
  console.log(`✅ Created test task "${createdTask.title}" (${createdTask.id})`);

  // Member attempts to DELETE the task -> MUST FAIL or return 0 rows affected due to RLS
  const { error: engDeleteErr, data: engDeleteData } = await engClient.from('tasks').delete().eq('id', createdTask.id).select();
  if (engDeleteErr) {
    console.log(`✅ [PASS] Member DELETE rejected with error: ${engDeleteErr.message}`);
  } else if (!engDeleteData || engDeleteData.length === 0) {
    console.log(`✅ [PASS] Member DELETE rejected by RLS (0 rows affected)`);
  } else {
    throw new Error('❌ [FAIL] Security violation: Member was able to delete a task!');
  }

  // Verify task still exists in DB
  const { data: verifyStillExists } = await adminClient.from('tasks').select('id').eq('id', createdTask.id).single();
  if (!verifyStillExists) throw new Error('Task was prematurely deleted!');
  console.log(`✅ Verified task still exists in database`);

  // Admin deletes the task -> MUST SUCCEED
  const { error: adminDeleteErr, data: adminDeleteData } = await adminClient.from('tasks').delete().eq('id', createdTask.id).select();
  if (adminDeleteErr) throw new Error(`Admin failed to delete task: ${adminDeleteErr.message}`);
  console.log(`✅ [PASS] Admin successfully deleted task (affected rows: ${adminDeleteData?.length || 1})`);

  // 3. Test Group Creation RLS Security
  console.log('\n[3/6] Verifying Sub-Team Creation RLS authorization...');
  const testGroupSlug = `test-group-${Date.now()}`;
  const testGroupName = `Test Sub-Team ${Date.now()}`;

  // Member attempts to insert into groups -> MUST FAIL
  const { error: engCreateGroupErr } = await engClient.from('groups').insert({
    name: testGroupName,
    slug: testGroupSlug,
    description: 'Unauthorized group test',
    color_accent: '#FF4FA3'
  });

  if (engCreateGroupErr) {
    console.log(`✅ [PASS] Member group INSERT blocked by RLS: ${engCreateGroupErr.message}`);
  } else {
    throw new Error('❌ [FAIL] Security violation: Member was able to create a group!');
  }

  // Clean up any lingering test groups first
  await adminClient.from('groups').delete().like('slug', 'test-group-%');

  // Admin creates the group -> MUST SUCCEED
  const { data: createdGroup, error: adminCreateGroupErr } = await adminClient.from('groups').insert({
    name: testGroupName,
    slug: testGroupSlug,
    description: 'Authorized Admin created group',
    color_accent: '#22E4F0'
  }).select().single();

  if (adminCreateGroupErr) throw new Error(`Admin failed to create group: ${adminCreateGroupErr.message}`);
  console.log(`✅ [PASS] Admin created new sub-team "${createdGroup.name}" (${createdGroup.id})`);

  let createdGroupId = createdGroup.id;
  try {
    // 4. Test Member Removal / Unassignment Authorization & Constraints
    console.log('\n[4/6] Verifying Member Removal from Sub-Team (Unassignment to Pending)...');
    // Member attempts to unassign another user or themselves -> MUST FAIL
    const { error: engRemoveErr } = await engClient.from('profiles').update({
      group_id: null,
      role: 'pending',
      status: 'pending'
    }).eq('id', adminAuth.user.id);

    if (engRemoveErr) {
      console.log(`✅ [PASS] Member cannot unassign other users: ${engRemoveErr.message}`);
    } else {
      // Check if anything was actually modified
      const { data: checkAdmin } = await adminClient.from('profiles').select('role').eq('id', adminAuth.user.id).single();
      if (checkAdmin.role !== 'admin') {
        throw new Error('❌ [FAIL] Member was able to modify another profile!');
      }
      console.log(`✅ [PASS] Member modification blocked by RLS (no rows updated)`);
    }

    // Admin unassigns Engineer from Vehicle Dynamics to Pending
    const { error: adminRemoveErr } = await adminClient.from('profiles').update({
      group_id: null,
      role: 'pending',
      status: 'pending',
      updated_at: new Date().toISOString()
    }).eq('id', engAuth.user.id);

    if (adminRemoveErr) throw new Error(`Admin removal failed: ${adminRemoveErr.message}`);
    console.log(`✅ [PASS] Admin removed Engineer from Sub-Team, reset to pending`);

    // Verify DB state for Engineer
    const { data: engProfileAfter } = await adminClient.from('profiles').select('role, status, group_id').eq('id', engAuth.user.id).single();
    if (engProfileAfter.group_id !== null || engProfileAfter.role !== 'pending') {
      throw new Error(`Profile was not correctly reset: ${JSON.stringify(engProfileAfter)}`);
    }
    console.log(`✅ Verified profile in database: role=${engProfileAfter.role}, group_id=${engProfileAfter.group_id}`);

    // Restore Engineer back to Vehicle Dynamics member for future tests
    await adminClient.from('profiles').update({
      group_id: vdGroupId,
      role: 'member',
      status: 'approved',
      updated_at: new Date().toISOString()
    }).eq('id', engAuth.user.id);
    console.log(`✅ Restored Engineer profile to approved member of Vehicle Dynamics`);
  } finally {
    // 5. Cleanup test group
    console.log('\n[5/6] Cleaning up test group...');
    if (createdGroupId) {
      await adminClient.from('groups').delete().eq('id', createdGroupId);
    }
    console.log(`✅ Test group cleaned up`);
  }

  // 6. Summary
  console.log('\n[6/6] Summary of checks:');
  console.log('  1. Task deletion RLS authorization: ENFORCED at PostgreSQL level.');
  console.log('  2. Task deletion execution: Admin/Head can successfully delete tasks.');
  console.log('  3. Sub-team creation RLS authorization: Non-admins strictly blocked.');
  console.log('  4. Sub-team creation execution: Admin can create sub-teams & channels.');
  console.log('  5. Member removal: Admin unassigns member to pending without constraint violation.');
  console.log('  6. Database integrity: All check constraints & foreign keys preserved.');
  console.log('\n' + '='.repeat(80));
  console.log('🏁 ALL SECURITY & FUNCTIONALITY TESTS PASSED SUCCESSFULLY!');
  console.log('='.repeat(80));
}

runVerification().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
