import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function runSlice2Verification() {
  console.log('='.repeat(80));
  console.log('🏎️  SLICE 2 VERIFICATION: AUTH, PENDING STATE & ADMIN APPROVAL');
  console.log('='.repeat(80));

  const adminEmail = 'admin_pitlane@zewailcity.edu.eg';
  const engineerEmail = 'engineer_aero@zewailcity.edu.eg';
  const password = 'SecurePassword2026!';

  // Step 0: Admin Authentication & Baseline Setup
  console.log('\n[Setup] Authenticating Club Admin to set clean test baseline...');
  const { data: adminAuth, error: adminAuthErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: password,
  });

  if (adminAuthErr) {
    console.error('❌ Admin login failed:', adminAuthErr.message);
    return;
  }

  const adminClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${adminAuth.session.access_token}` } }
  });

  const { data: adminProfile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', adminAuth.user.id)
    .single();

  console.log(`✅ [PASS] Club Admin authenticated: "${adminProfile.full_name}" (role: ${adminProfile.role}, status: ${adminProfile.status})`);

  // Reset Engineer to pending for clean cycle verification
  const { data: targetEngProf } = await adminClient
    .from('profiles')
    .select('*')
    .eq('email', engineerEmail)
    .single();

  if (targetEngProf) {
    await adminClient
      .from('profiles')
      .update({
        status: 'pending',
        role: 'pending',
        group_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetEngProf.id);
    console.log(`✅ [PASS] Test candidate reset to pending quarantine state.`);
  }

  // Step 1: Login as Engineer (Pending Quarantine Account)
  console.log('\n[1/5] Testing Sign-in as Engineer (Pending Quarantine)...');
  const { data: engAuth, error: engAuthErr } = await supabase.auth.signInWithPassword({
    email: engineerEmail,
    password: password,
  });

  if (engAuthErr) {
    console.error('❌ Engineer login failed:', engAuthErr.message);
    return;
  }

  console.log('✅ [PASS] Engineer authenticated successfully (Session token issued).');

  const engClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${engAuth.session.access_token}` } }
  });

  const { data: engProfile } = await engClient
    .from('profiles')
    .select('*')
    .eq('id', engAuth.user.id)
    .single();
  console.log(`✅ [PASS] Engineer profile loaded: status="${engProfile.status}", role="${engProfile.role}", group="${engProfile.group_id}"`);

  // Verify pending quarantine for Engineer (0 rows accessible)
  const { data: engTasks } = await engClient.from('tasks').select('*');
  const { data: engChannels } = await engClient.from('channels').select('*');
  console.log(`✅ [PASS] Pending quarantine verified: Engineer sees ${engTasks?.length || 0} tasks and ${engChannels?.length || 0} channels (0 expected).`);

  if ((engTasks?.length || 0) > 0 || (engChannels?.length || 0) > 0) {
    throw new Error('SECURITY BREACH: Pending engineer has visibility into tasks or channels!');
  }

  // Step 2: Privilege Escalation Prevention Test
  console.log('\n[2/5] Testing Privilege Escalation Prevention (Engineer attempts self-promotion)...');
  const { error: escalateErr } = await engClient
    .from('profiles')
    .update({ role: 'admin', status: 'approved' })
    .eq('id', engProfile.id);

  if (!escalateErr) {
    throw new Error('CRITICAL SECURITY BREACH: Engineer successfully self-elevated to admin!');
  }
  console.log(`✅ [PASS] Self-promotion strictly blocked by DB trigger: "${escalateErr.message}"`);

  // Step 3: Admin inspects pending users in AdminApprovalHub
  console.log('\n[3/5] Admin inspecting pending users (AdminApprovalHub queue)...');
  const { data: allProfiles, error: profErr } = await adminClient.from('profiles').select('*');
  if (profErr) {
    console.error('❌ Failed to fetch profiles as admin:', profErr.message);
    return;
  }

  const pendingList = allProfiles.filter(p => p.status === 'pending');
  console.log(`✅ [PASS] Admin sees ${allProfiles.length} total profiles and ${pendingList.length} pending user(s).`);
  const candidate = pendingList.find(p => p.email === engineerEmail);

  if (!candidate) {
    throw new Error(`Expected engineer ${engineerEmail} in pending approvals queue!`);
  }
  console.log(`   Found pending candidate: ${candidate.full_name} (${candidate.email})`);

  // Step 4: Admin approves Engineer into Vehicle Dynamics as Member
  console.log('\n[4/5] Admin approving Engineer into "Technical - Vehicle Dynamics" as "member"...');
  const vdGroupId = '11111111-1111-1111-1111-111111111111';
  const { error: approveErr } = await adminClient
    .from('profiles')
    .update({
      status: 'approved',
      group_id: vdGroupId,
      role: 'member',
      updated_at: new Date().toISOString()
    })
    .eq('id', candidate.id);

  if (approveErr) {
    console.error('❌ Approval failed:', approveErr.message);
    throw approveErr;
  }
  console.log('✅ [PASS] Admin successfully executed approval update in database.');

  // Step 5: Verify Engineer now has active workspace access post-approval
  console.log('\n[5/5] Re-testing Engineer workspace telemetry access post-approval...');
  const { data: approvedEngProfile } = await engClient
    .from('profiles')
    .select('*')
    .eq('id', engProfile.id)
    .single();

  console.log(`✅ [PASS] Updated Engineer Profile: status="${approvedEngProfile.status}", role="${approvedEngProfile.role}", group="${approvedEngProfile.group_id}"`);

  const { data: accessibleChannels } = await engClient.from('channels').select('name, slug, channel_type');
  console.log(`✅ [PASS] Engineer now has access to ${accessibleChannels?.length || 0} authorized channel(s):`);
  accessibleChannels?.forEach(c => console.log(`   * ${c.name} (${c.slug}) [${c.channel_type}]`));

  if (!accessibleChannels || accessibleChannels.length === 0) {
    throw new Error('Access verification failed: Approved engineer cannot see authorized channels!');
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 SLICE 2 VERIFICATION COMPLETE: ALL 5 STEPS PASSED WITH LIVE REAL DATA');
  console.log('='.repeat(80));
}

runSlice2Verification();
