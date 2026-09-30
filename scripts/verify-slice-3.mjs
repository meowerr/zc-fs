import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function runSlice3Verification() {
  console.log('='.repeat(80));
  console.log('🏎️  SLICE 3 VERIFICATION: TASKS, ASSIGNEES, SUBMISSIONS & REVIEWS');
  console.log('='.repeat(80));

  const adminEmail = 'admin_pitlane@zewailcity.edu.eg';
  const engineerEmail = 'engineer_aero@zewailcity.edu.eg';
  const password = 'SecurePassword2026!';
  const vdGroupId = '11111111-1111-1111-1111-111111111111'; // Technical - Vehicle Dynamics
  const aeroGroupId = '22222222-2222-2222-2222-222222222222'; // Technical - Aerodynamics

  // Step 0: Authenticate Admin & Engineer
  console.log('\n[Setup] Authenticating test accounts...');
  const { data: adminAuth, error: adminAuthErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: password,
  });
  if (adminAuthErr) throw new Error(`Admin auth failed: ${adminAuthErr.message}`);

  const { data: engAuth, error: engAuthErr } = await supabase.auth.signInWithPassword({
    email: engineerEmail,
    password: password,
  });
  if (engAuthErr) throw new Error(`Engineer auth failed: ${engAuthErr.message}`);

  const adminClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${adminAuth.session.access_token}` } }
  });
  const engClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${engAuth.session.access_token}` } }
  });

  const { data: adminProf } = await adminClient.from('profiles').select('*').eq('id', adminAuth.user.id).single();
  const { data: engProf } = await engClient.from('profiles').select('*').eq('id', engAuth.user.id).single();
  console.log(`✅ [PASS] Admin session established: "${adminProf.full_name}" (role: ${adminProf.role})`);
  console.log(`✅ [PASS] Engineer session established: "${engProf.full_name}" (role: ${engProf.role}, group: ${engProf.group_id})`);

  // Ensure Engineer is assigned to Vehicle Dynamics for this test
  if (engProf.group_id !== vdGroupId || engProf.status !== 'approved') {
    await adminClient.from('profiles').update({
      status: 'approved',
      role: 'member',
      group_id: vdGroupId,
    }).eq('id', engProf.id);
  }

  // Step 1: Admin creates a Task for Vehicle Dynamics with Engineer as Assignee
  console.log('\n[1/8] Admin creating Task with multi-assignee junction in Vehicle Dynamics...');
  const { data: createdTask, error: createTaskErr } = await adminClient
    .from('tasks')
    .insert({
      group_id: vdGroupId,
      creator_id: adminProf.id,
      title: 'Telemetry Wheel Rate & Damper Curve Optimization',
      description: 'Analyze telemetry run #042 data and optimize damper rebound settings for Silverstone track.',
      task_type: 'research',
      priority: 'high',
      deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
      links: [{ title: 'Telemetry Logs', url: 'https://telemetry.zewail-racing.com/runs/042' }]
    })
    .select()
    .single();

  if (createTaskErr) {
    console.error('❌ Create task error:', JSON.stringify(createTaskErr, null, 2));
    throw new Error(createTaskErr.message);
  }
  console.log(`✅ [PASS] Task created: "${createdTask.title}" (ID: ${createdTask.id}, Status: ${createdTask.status})`);

  // Add Engineer to task_assignees
  const { error: assignErr } = await adminClient
    .from('task_assignees')
    .insert({
      task_id: createdTask.id,
      user_id: engProf.id,
      status: 'assigned',
    });
  if (assignErr) throw assignErr;
  console.log(`✅ [PASS] Assignee junction record created: user="${engProf.email}" -> task="${createdTask.id}"`);

  // Step 2: Cross-Group RLS Task Isolation
  console.log('\n[2/8] Testing Cross-Group RLS isolation on Tasks...');
  // Admin creates an Aero task
  const { data: aeroTask, error: aeroErr } = await adminClient
    .from('tasks')
    .insert({
      group_id: aeroGroupId,
      creator_id: adminProf.id,
      title: 'Aero Tunnel Front Flap Deflection Study',
      description: 'Aerodynamics team internal deliverable.',
      task_type: 'design',
      priority: 'medium',
      deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
    })
    .select()
    .single();
  if (aeroErr) throw aeroErr;

  // Engineer queries tasks
  const { data: engVisibleTasks } = await engClient.from('tasks').select('id, title, group_id');
  const seesOwnGroupTask = engVisibleTasks?.some(t => t.id === createdTask.id);
  const seesAeroTask = engVisibleTasks?.some(t => t.id === aeroTask.id);

  console.log(`✅ [PASS] Engineer sees own group task: ${seesOwnGroupTask} | Sees Aero task: ${seesAeroTask}`);
  if (!seesOwnGroupTask || seesAeroTask) {
    throw new Error('RLS BREACH: Cross-group task isolation check failed!');
  }

  // Step 3: Member starts work (status rollup to in_progress)
  console.log('\n[3/8] Member starts work (assignee status: in_progress -> task status rollup)...');
  const { error: startWorkErr } = await engClient
    .from('task_assignees')
    .update({ status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('task_id', createdTask.id)
    .eq('user_id', engProf.id);
  if (startWorkErr) throw startWorkErr;

  const { data: taskAfterStart } = await engClient.from('tasks').select('status').eq('id', createdTask.id).single();
  console.log(`✅ [PASS] Task status automatically rolled up to: "${taskAfterStart.status}" via DB trigger.`);
  if (taskAfterStart.status !== 'in_progress') {
    throw new Error(`Expected task status 'in_progress', got '${taskAfterStart.status}'`);
  }

  // Step 4: Discussion Comments
  console.log('\n[4/8] Discussion Comments between Engineer and Admin...');
  const { error: engCommErr } = await engClient.from('task_comments').insert({
    task_id: createdTask.id,
    author_id: engProf.id,
    content: 'Initial data extracted from sensor channels FL_Shock_Pot and FR_Shock_Pot.',
  });
  if (engCommErr) throw engCommErr;

  const { error: adminCommErr } = await adminClient.from('task_comments').insert({
    task_id: createdTask.id,
    author_id: adminProf.id,
    content: 'Check high-speed rebound damping especially on curbing transient events.',
  });
  if (adminCommErr) throw adminCommErr;

  const { data: comments } = await engClient
    .from('task_comments')
    .select('content, author_id, created_at')
    .eq('task_id', createdTask.id)
    .order('created_at', { ascending: true });

  console.log(`✅ [PASS] Retrieved ${comments?.length} discussion comment(s) for task.`);
  if ((comments?.length || 0) < 2) throw new Error('Failed to retrieve task comments.');

  // Step 5: Multi-Version Deliverable Submission (v1)
  console.log('\n[5/8] Member submitting Deliverable v1...');
  const { data: subV1, error: subV1Err } = await engClient
    .from('task_submissions')
    .insert({
      task_id: createdTask.id,
      submitted_by: engProf.id,
      version_number: 1,
      submission_type: 'link',
      content: 'https://workspace.zewail-racing.com/damper_curves_v1.pdf',
      notes: 'v1 calculation completed with linear damping model.',
      review_status: 'pending'
    })
    .select()
    .single();
  if (subV1Err) throw subV1Err;

  // Update assignee status to submitted
  await engClient
    .from('task_assignees')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('task_id', createdTask.id)
    .eq('user_id', engProf.id);

  const { data: taskAfterSub } = await engClient.from('tasks').select('status').eq('id', createdTask.id).single();
  console.log(`✅ [PASS] Submission v1 created (ID: ${subV1.id}). Task rolled up to: "${taskAfterSub.status}".`);
  if (taskAfterSub.status !== 'submitted') {
    throw new Error(`Expected task status 'submitted', got '${taskAfterSub.status}'`);
  }

  // Step 6: Review Workflow - Changes Requested on v1
  console.log('\n[6/8] Admin reviewing v1: Requesting changes with engineering feedback...');
  const { error: reviewV1Err } = await adminClient
    .from('task_submissions')
    .update({
      review_status: 'changes_requested',
      review_feedback: 'Linear damping is insufficient over curbs. Use digressive damper curve at >100mm/s velocity.',
      reviewed_by: adminProf.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', subV1.id);
  if (reviewV1Err) throw reviewV1Err;

  // Update assignee status to changes_requested
  await adminClient
    .from('task_assignees')
    .update({ status: 'changes_requested', updated_at: new Date().toISOString() })
    .eq('task_id', createdTask.id)
    .eq('user_id', engProf.id);

  const { data: taskAfterReview1 } = await engClient.from('tasks').select('status').eq('id', createdTask.id).single();
  console.log(`✅ [PASS] Review v1 submitted. Task rolled up to: "${taskAfterReview1.status}".`);
  if (taskAfterReview1.status !== 'changes_requested') {
    throw new Error(`Expected task status 'changes_requested', got '${taskAfterReview1.status}'`);
  }

  // Step 7: Member submits v2 Revision & Admin Approves
  console.log('\n[7/8] Member submits Deliverable v2 revision & Admin Approves...');
  const { data: subV2, error: subV2Err } = await engClient
    .from('task_submissions')
    .insert({
      task_id: createdTask.id,
      submitted_by: engProf.id,
      version_number: 2,
      submission_type: 'link',
      content: 'https://workspace.zewail-racing.com/damper_curves_digressive_v2.pdf',
      notes: 'v2 recalculated with 3-stage digressive valving model.',
      review_status: 'pending'
    })
    .select()
    .single();
  if (subV2Err) throw subV2Err;

  // Admin approves v2
  const { error: approveV2Err } = await adminClient
    .from('task_submissions')
    .update({
      review_status: 'approved',
      review_feedback: 'Digressive curve perfectly matches Silverstone simulation data. Approved!',
      reviewed_by: adminProf.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', subV2.id);
  if (approveV2Err) throw approveV2Err;

  // Update assignee status to approved
  await adminClient
    .from('task_assignees')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('task_id', createdTask.id)
    .eq('user_id', engProf.id);

  const { data: taskAfterApproval } = await engClient.from('tasks').select('status').eq('id', createdTask.id).single();
  console.log(`✅ [PASS] Deliverable v2 approved! Task status rolled up to: "${taskAfterApproval.status}".`);
  if (taskAfterApproval.status !== 'approved') {
    throw new Error(`Expected task status 'approved', got '${taskAfterApproval.status}'`);
  }

  // Step 8: Negative Security Checks
  console.log('\n[8/8] Testing Negative Security Checks (Unauthorized actions blocked by RLS)...');
  // 1. Member cannot create task in another group (Aero)
  const { error: memberIllegalTaskErr } = await engClient
    .from('tasks')
    .insert({
      group_id: aeroGroupId,
      creator_id: engProf.id,
      title: 'Hacked Task in Aero',
      task_type: 'design',
      priority: 'low',
      deadline: new Date().toISOString(),
    });
  console.log(`✅ [PASS] Member blocked from creating task in foreign group: ${!!memberIllegalTaskErr}`);
  if (!memberIllegalTaskErr) {
    throw new Error('SECURITY BREACH: Member was able to create task in foreign group!');
  }

  // 2. Member cannot review submissions (RLS returns 0 rows updated)
  const { data: illegalReviewData, error: memberIllegalReviewErr } = await engClient
    .from('task_submissions')
    .update({ review_status: 'approved' })
    .eq('id', subV1.id)
    .select();
  const reviewBlocked = !!memberIllegalReviewErr || (illegalReviewData?.length === 0);
  console.log(`✅ [PASS] Member blocked from reviewing submissions: ${reviewBlocked} (0 rows updated)`);
  if (!reviewBlocked) {
    throw new Error('SECURITY BREACH: Member was able to review submission!');
  }

  // Cleanup Aero test task
  await adminClient.from('tasks').delete().eq('id', aeroTask.id);

  console.log('\n' + '='.repeat(80));
  console.log('🏁 SLICE 3 VERIFICATION COMPLETE: ALL 8 STEPS PASSED WITH LIVE REAL DATA');
  console.log('='.repeat(80));
}

runSlice3Verification();
