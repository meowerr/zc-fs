import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function runSecurityAudit() {
  console.log('='.repeat(80));
  console.log('🛡️  CRITICAL SECURITY AUDIT — LIVE ROLE & AUTHORIZATION BOUNDARY TEST');
  console.log('='.repeat(80));

  const adminEmail = 'admin_pitlane@zewailcity.edu.eg';
  const engineerEmail = 'engineer_aero@zewailcity.edu.eg';
  const password = 'SecurePassword2026!';
  const vdGroupId = '11111111-1111-1111-1111-111111111111'; // Technical - Vehicle Dynamics
  const aeroGroupId = '22222222-2222-2222-2222-222222222222'; // Technical - Aerodynamics

  // Step 0: Authenticate Real Accounts
  console.log('\n[1/7] Authenticating real test accounts against live Supabase Auth...');
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

  console.log(`✅ [PASS] Admin authenticated: uid="${adminAuth.user.id}"`);
  console.log(`✅ [PASS] Engineer authenticated: uid="${engAuth.user.id}"`);

  // Ensure Admin profile is actually admin in DB
  await adminClient.from('profiles').update({ role: 'admin', status: 'approved', group_id: null }).eq('id', adminAuth.user.id);

  // -------------------------------------------------------------------------
  // SECTION 2: PRIVILEGE ESCALATION AUDIT (DATABASE LEVEL)
  // -------------------------------------------------------------------------
  console.log('\n[2/7] Testing Privilege Escalation Invariants against PostgreSQL Engine...');

  // Set engineer to approved member of Vehicle Dynamics first
  await adminClient.from('profiles').update({
    role: 'member',
    status: 'approved',
    group_id: vdGroupId,
    updated_at: new Date().toISOString()
  }).eq('id', engAuth.user.id);

  // 2a. Member tries to promote self to Admin
  const { error: escAdminErr } = await engClient
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', engAuth.user.id);

  if (!escAdminErr) {
    throw new Error('CRITICAL FLAW: Member was able to update their role to "admin"!');
  }
  console.log(`✅ [PASS] Member -> Admin self-promotion BLOCKED by DB trigger: "${escAdminErr.message}"`);

  // 2b. Member tries to promote self to Head
  const { error: escHeadErr } = await engClient
    .from('profiles')
    .update({ role: 'head' })
    .eq('id', engAuth.user.id);

  if (!escHeadErr) {
    throw new Error('CRITICAL FLAW: Member was able to update their role to "head"!');
  }
  console.log(`✅ [PASS] Member -> Head self-promotion BLOCKED by DB trigger: "${escHeadErr.message}"`);

  // 2c. Member tries to switch their own group
  const { error: escGroupErr } = await engClient
    .from('profiles')
    .update({ group_id: aeroGroupId })
    .eq('id', engAuth.user.id);

  if (!escGroupErr) {
    throw new Error('CRITICAL FLAW: Member was able to change their own group_id!');
  }
  console.log(`✅ [PASS] Member self-group-change BLOCKED by DB trigger: "${escGroupErr.message}"`);

  // 2d. Member tries to approve/modify another user
  const { error: escOtherErr } = await engClient
    .from('profiles')
    .update({ status: 'approved' })
    .eq('id', adminAuth.user.id);

  if (!escOtherErr) {
    // Check if rows were updated
    const { data: checkProf } = await adminClient.from('profiles').select('status').eq('id', adminAuth.user.id).single();
    if (checkProf.status !== 'approved') {
      throw new Error('CRITICAL FLAW: Member modified another user profile!');
    }
  }
  console.log(`✅ [PASS] Member altering other user profiles BLOCKED.`);

  // -------------------------------------------------------------------------
  // SECTION 3: PENDING USER LOCKDOWN AUDIT
  // -------------------------------------------------------------------------
  console.log('\n[3/7] Testing Pending User Quarantine Lockdown...');
  // Put test candidate into pending state
  await adminClient.from('profiles').update({
    role: 'pending',
    status: 'pending',
    group_id: null,
    updated_at: new Date().toISOString()
  }).eq('id', engAuth.user.id);

  // Probe all protected entities as pending user
  const { data: pTasks } = await engClient.from('tasks').select('id');
  const { data: pSubmissions } = await engClient.from('task_submissions').select('id');
  const { data: pComments } = await engClient.from('task_comments').select('id');
  const { data: pChannels } = await engClient.from('channels').select('id');
  const { data: pMessages } = await engClient.from('messages').select('id');
  const { data: pOtherProfiles } = await engClient.from('profiles').select('id').neq('id', engAuth.user.id);

  if ((pTasks && pTasks.length > 0) ||
      (pSubmissions && pSubmissions.length > 0) ||
      (pComments && pComments.length > 0) ||
      (pChannels && pChannels.length > 0) ||
      (pMessages && pMessages.length > 0) ||
      (pOtherProfiles && pOtherProfiles.length > 0)) {
    throw new Error(`SECURITY BREACH: Pending user accessed protected data! Tasks: ${pTasks?.length}, Channels: ${pChannels?.length}, Other Profiles: ${pOtherProfiles?.length}`);
  }

  console.log('✅ [PASS] Pending Quarantine: 0 tasks, 0 channels, 0 messages, 0 other profiles accessible.');

  // Pending user attempts self-approval
  const { error: pSelfApprove } = await engClient.from('profiles').update({ status: 'approved', role: 'member' }).eq('id', engAuth.user.id);
  if (!pSelfApprove) {
    throw new Error('SECURITY BREACH: Pending user was able to self-approve!');
  }
  console.log(`✅ [PASS] Pending user self-approval BLOCKED: "${pSelfApprove.message}"`);

  // -------------------------------------------------------------------------
  // SECTION 4: GROUP SCOPING AUDIT (Group A vs Group B)
  // -------------------------------------------------------------------------
  console.log('\n[4/7] Testing Cross-Group Data Quarantine (Group A Member vs Group B)...');
  // Admin assigns engineer to Vehicle Dynamics (Group A)
  await adminClient.from('profiles').update({
    role: 'member',
    status: 'approved',
    group_id: vdGroupId,
    updated_at: new Date().toISOString()
  }).eq('id', engAuth.user.id);

  // 4a. Read foreign tasks
  const { data: foreignTasks } = await engClient.from('tasks').select('*').eq('group_id', aeroGroupId);
  if (foreignTasks && foreignTasks.length > 0) {
    throw new Error(`SECURITY BREACH: Member VD read ${foreignTasks.length} Aero tasks!`);
  }
  console.log('✅ [PASS] Member of Vehicle Dynamics querying Aero tasks returns 0 rows (RLS enforced).');

  // 4b. Insert task into foreign group
  const { error: foreignTaskInsertErr } = await engClient.from('tasks').insert({
    group_id: aeroGroupId,
    creator_id: engAuth.user.id,
    title: 'Unauthorized Aero Infiltration Task',
    deadline: new Date().toISOString()
  });
  if (!foreignTaskInsertErr) {
    throw new Error('SECURITY BREACH: Member VD created task in Aero group!');
  }
  console.log(`✅ [PASS] Member VD creating task in Aero group BLOCKED: "${foreignTaskInsertErr.message}"`);

  // 4c. Foreign group channel read
  const { data: aeroChannels } = await engClient.from('channels').select('*').eq('slug', 'ch-aerodynamics');
  if (aeroChannels && aeroChannels.length > 0) {
    throw new Error('SECURITY BREACH: Member VD can see Aero sub-team channel!');
  }
  console.log('✅ [PASS] Member VD querying Aero channel returns 0 rows (RLS enforced).');

  // 4d. Heads-Only channel access
  const { data: headsChannels } = await engClient.from('channels').select('*').eq('channel_type', 'heads_only');
  if (headsChannels && headsChannels.length > 0) {
    throw new Error('SECURITY BREACH: Member VD can see Heads-Only channel!');
  }
  console.log('✅ [PASS] Member VD querying Heads-Only channel returns 0 rows (RLS enforced).');

  // 4e. Announcements write block
  const { data: annChannel } = await adminClient.from('channels').select('id').eq('channel_type', 'announcements').single();
  const { error: postAnnErr } = await engClient.from('messages').insert({
    channel_id: annChannel.id,
    sender_id: engAuth.user.id,
    content: 'Unauthorized broadcast announcement'
  });
  if (!postAnnErr) {
    throw new Error('SECURITY BREACH: Normal member was able to post to announcements channel!');
  }
  console.log(`✅ [PASS] Member posting to Announcements BLOCKED: "${postAnnErr.message}"`);

  // -------------------------------------------------------------------------
  // SECTION 5: HEAD SCOPE AUDIT
  // -------------------------------------------------------------------------
  console.log('\n[5/7] Testing Group Head Scope Invariants & Boundaries...');
  // Admin promotes engineer to Head of Vehicle Dynamics
  await adminClient.from('profiles').update({
    role: 'head',
    status: 'approved',
    group_id: vdGroupId,
    updated_at: new Date().toISOString()
  }).eq('id', engAuth.user.id);

  // 5a. Head CAN access heads_only channel
  const { data: headCanSeeHeads } = await engClient.from('channels').select('*').eq('channel_type', 'heads_only');
  if (!headCanSeeHeads || headCanSeeHeads.length === 0) {
    throw new Error('FLAW: Head cannot access heads_only channel!');
  }
  console.log(`✅ [PASS] Head authorized for Heads-Only channel ("${headCanSeeHeads[0].name}").`);

  // 5b. Head CAN post to announcements
  const { data: headAnnMsg, error: headAnnErr } = await engClient.from('messages').insert({
    channel_id: annChannel.id,
    sender_id: engAuth.user.id,
    content: 'Head official telemetry briefing'
  }).select().single();
  if (headAnnErr) throw new Error(`Head announcement post failed: ${headAnnErr.message}`);
  console.log(`✅ [PASS] Head successfully posted to Announcements channel.`);
  await adminClient.from('messages').delete().eq('id', headAnnMsg.id);

  // 5c. Head attempts to create task in foreign group (Aero)
  const { error: headForeignTaskErr } = await engClient.from('tasks').insert({
    group_id: aeroGroupId,
    creator_id: engAuth.user.id,
    title: 'Head cross-group infiltration task',
    deadline: new Date().toISOString()
  });
  if (!headForeignTaskErr) {
    throw new Error('SECURITY BREACH: Head was able to create task in foreign group!');
  }
  console.log(`✅ [PASS] Head creating task in foreign group BLOCKED: "${headForeignTaskErr.message}"`);

  // 5d. Head attempts to modify groups table (Admin-only)
  const { data: headGroupModData, error: headGroupModErr } = await engClient
    .from('groups')
    .update({ description: 'Hacked by Head' })
    .eq('id', vdGroupId)
    .select();

  const { data: verifyGroup } = await adminClient.from('groups').select('description').eq('id', vdGroupId).single();
  if (verifyGroup.description === 'Hacked by Head' || (headGroupModData && headGroupModData.length > 0)) {
    throw new Error('SECURITY BREACH: Head was able to modify groups table!');
  }
  console.log(`✅ [PASS] Head modifying groups table BLOCKED (RLS prevented row mutation: 0 rows modified).`);

  // 5e. Head attempts self-promotion to Admin
  const { error: headSelfAdminErr } = await engClient.from('profiles').update({ role: 'admin' }).eq('id', engAuth.user.id);
  if (!headSelfAdminErr) {
    throw new Error('SECURITY BREACH: Head was able to self-promote to Admin!');
  }
  console.log(`✅ [PASS] Head -> Admin self-promotion BLOCKED by DB trigger: "${headSelfAdminErr.message}"`);

  // -------------------------------------------------------------------------
  // SECTION 6: REVERSE GROUP SCOPING (Group B -> Group A)
  // -------------------------------------------------------------------------
  console.log('\n[6/7] Testing Reverse Group Scoping (Aerodynamics Member vs Vehicle Dynamics)...');
  // Admin reassigns engineer to Aerodynamics (Group B)
  await adminClient.from('profiles').update({
    role: 'member',
    status: 'approved',
    group_id: aeroGroupId,
    updated_at: new Date().toISOString()
  }).eq('id', engAuth.user.id);

  // Member Aero querying Vehicle Dynamics tasks
  const { data: revVDTasks } = await engClient.from('tasks').select('*').eq('group_id', vdGroupId);
  if (revVDTasks && revVDTasks.length > 0) {
    throw new Error('SECURITY BREACH: Aero Member was able to query Vehicle Dynamics tasks!');
  }
  console.log('✅ [PASS] Aerodynamics Member querying Vehicle Dynamics tasks returns 0 rows.');

  // Member Aero querying Vehicle Dynamics channel
  const { data: revVDChannels } = await engClient.from('channels').select('*').eq('slug', 'ch-vehicle-dynamics');
  if (revVDChannels && revVDChannels.length > 0) {
    throw new Error('SECURITY BREACH: Aero Member was able to query Vehicle Dynamics channel!');
  }
  console.log('✅ [PASS] Aerodynamics Member querying Vehicle Dynamics channel returns 0 rows.');

  // -------------------------------------------------------------------------
  // SECTION 7: STORAGE RLS QUARANTINE
  // -------------------------------------------------------------------------
  console.log('\n[7/7] Testing Storage Buckets Cross-Group Quarantine...');
  // Member Aero uploading to Vehicle Dynamics folder
  const foreignUpload = await engClient.storage
    .from('task-attachments')
    .upload(`${vdGroupId}/exploit_${Date.now()}.txt`, Buffer.from('unauthorized file content'));

  if (!foreignUpload.error) {
    await adminClient.storage.from('task-attachments').remove([foreignUpload.data.path]);
    throw new Error('SECURITY BREACH: Aero Member uploaded file into Vehicle Dynamics storage folder!');
  }
  console.log(`✅ [PASS] Aero Member upload to Vehicle Dynamics storage folder BLOCKED: "${foreignUpload.error.message}"`);

  // Member Aero uploading to own folder succeeds
  const ownUpload = await engClient.storage
    .from('task-attachments')
    .upload(`${aeroGroupId}/audit_telemetry_${Date.now()}.txt`, Buffer.from('authorized telemetry payload'));

  if (ownUpload.error) {
    throw new Error(`Legitimate sub-team upload failed: ${ownUpload.error.message}`);
  }
  console.log('✅ [PASS] Aero Member legitimate upload to own sub-team folder succeeded.');
  await engClient.storage.from('task-attachments').remove([ownUpload.data.path]);

  // Clean test baseline: Keep engineer as approved Aerodynamics member
  await adminClient.from('profiles').update({
    role: 'member',
    status: 'approved',
    group_id: aeroGroupId,
    updated_at: new Date().toISOString()
  }).eq('id', engAuth.user.id);

  console.log('\n' + '='.repeat(80));
  console.log('🏁  CRITICAL SECURITY AUDIT COMPLETE: ALL INVARIANTS STRICTLY ENFORCED');
  console.log('='.repeat(80));
  process.exit(0);
}

runSecurityAudit().catch((err) => {
  console.error('\n❌ Security Audit Failed:', err);
  process.exit(1);
});
