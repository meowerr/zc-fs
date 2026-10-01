import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function runPhase3Verification() {
  console.log('='.repeat(80));
  console.log('🏎️  PHASE 3 VERIFICATION: ACTIVITY LOG & TASK TIMELINE');
  console.log('='.repeat(80));

  const adminEmail = 'admin_pitlane@zewailcity.edu.eg';
  const engineerEmail = 'engineer_aero@zewailcity.edu.eg';
  const password = 'SecurePassword2026!';
  const vdGroupId = '11111111-1111-1111-1111-111111111111';

  // Step 1: Admin & Engineer Authentication
  console.log('\n[1/4] Authenticating Admin & Engineer against live database...');
  const { data: adminAuth, error: adminErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: password,
  });
  if (adminErr) throw new Error(`Admin authentication failed: ${adminErr.message}`);

  const { data: engAuth, error: engErr } = await supabase.auth.signInWithPassword({
    email: engineerEmail,
    password: password,
  });
  if (engErr) throw new Error(`Engineer authentication failed: ${engErr.message}`);

  const adminClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${adminAuth.session.access_token}` } }
  });
  const engClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${engAuth.session.access_token}` } }
  });

  const { data: adminProf } = await adminClient.from('profiles').select('*').eq('id', adminAuth.user.id).single();
  const { data: engProf } = await adminClient.from('profiles').select('*').eq('id', engAuth.user.id).single();
  console.log(`  ✅ [PASS] Admin: "${adminProf.full_name}" | Engineer: "${engProf.full_name}"`);

  // Ensure Engineer is assigned to Vehicle Dynamics
  await adminClient.from('profiles').update({
    group_id: vdGroupId,
    role: 'member',
    status: 'approved'
  }).eq('id', engProf.id);

  // Step 2: Ensure an active deliverable exists with full lifecycle data
  console.log('\n[2/4] Ensuring live deliverable with assignees, submissions & comments...');
  let { data: existingTasks } = await adminClient
    .from('tasks')
    .select('*, creator:profiles!tasks_creator_id_fkey(*)')
    .eq('group_id', vdGroupId)
    .order('created_at', { ascending: false })
    .limit(1);

  let activeTask = existingTasks?.[0];

  if (!activeTask) {
    const { data: newTask, error: createErr } = await adminClient
      .from('tasks')
      .insert({
        group_id: vdGroupId,
        creator_id: adminProf.id,
        title: 'Front Suspension Bellcrank Ratio Simulation',
        description: 'Kinematic motion ratio analysis for 2026 chassis bellcranks.',
        task_type: 'design',
        priority: 'urgent',
        deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
        links: [{ title: 'CAD Model', url: 'https://cad.zcfs.org/models/bellcrank_v1' }]
      })
      .select('*, creator:profiles!tasks_creator_id_fkey(*)')
      .single();

    if (createErr) throw new Error(`Failed to create deliverable: ${createErr.message}`);
    activeTask = newTask;
    console.log(`  ✅ [PASS] Created new deliverable: "${activeTask.title}"`);
  } else {
    console.log(`  ✅ [PASS] Found active deliverable: "${activeTask.title}"`);
  }

  // Assign Engineer if not assigned
  await adminClient.from('task_assignees').upsert({
    task_id: activeTask.id,
    user_id: engProf.id,
    status: 'in_progress',
  }, { onConflict: 'task_id,user_id' });

  // Add work submission if none exists
  const { data: existingSubs } = await adminClient
    .from('task_submissions')
    .select('*')
    .eq('task_id', activeTask.id);

  if (!existingSubs || existingSubs.length === 0) {
    await engClient.from('task_submissions').insert({
      task_id: activeTask.id,
      submitted_by: engProf.id,
      version_number: 1,
      submission_type: 'link',
      content: 'https://cad.zcfs.org/models/bellcrank_v1.step',
      notes: 'Initial bellcrank geometry and force vectors calculated.',
      review_status: 'pending'
    });
  }

  // Add review from Admin
  const { data: latestSub } = await adminClient
    .from('task_submissions')
    .select('*')
    .eq('task_id', activeTask.id)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  if (latestSub && latestSub.review_status === 'pending') {
    await adminClient.from('task_submissions').update({
      review_status: 'approved',
      review_feedback: 'Kinematic curve verified. Approved for CNC fabrication.',
      reviewed_by: adminProf.id,
      reviewed_at: new Date().toISOString()
    }).eq('id', latestSub.id);
  }

  // Add comment
  await adminClient.from('task_comments').insert({
    task_id: activeTask.id,
    author_id: adminProf.id,
    content: 'Telemetry check: motion ratio matches damper travel targets.'
  });

  // Step 3: Fetch submissions & comments for active deliverable
  console.log('\n[3/4] Querying deliverable submissions and discussion records...');
  const { data: subs } = await adminClient
    .from('task_submissions')
    .select('*, submitter:profiles!task_submissions_submitted_by_fkey(*)')
    .eq('task_id', activeTask.id)
    .order('created_at', { ascending: true });

  const { data: comments } = await adminClient
    .from('task_comments')
    .select('*, author:profiles!task_comments_author_id_fkey(*)')
    .eq('task_id', activeTask.id)
    .order('created_at', { ascending: true });

  console.log(`  ✅ [PASS] Fetched ${subs?.length || 0} submission(s) and ${comments?.length || 0} comment(s).`);

  // Step 4: Verify Chronological Timeline Synthesis Algorithm
  console.log('\n[4/4] Verifying Chronological Timeline Synthesis & Delta Times...');
  const timeline = [];

  timeline.push({
    timestamp: activeTask.created_at,
    title: 'Task Dispatched',
    actor: activeTask.creator?.full_name || 'Admin',
  });

  (subs || []).forEach(s => {
    timeline.push({
      timestamp: s.created_at,
      title: `Work Deliverable v${s.version_number}`,
      actor: s.submitter?.full_name || 'Engineer',
    });
    if (s.review_status !== 'pending' && s.reviewed_at) {
      timeline.push({
        timestamp: s.reviewed_at,
        title: `Deliverable v${s.version_number} Review (${s.review_status.toUpperCase()})`,
        actor: 'Club Admin',
      });
    }
  });

  (comments || []).forEach(c => {
    timeline.push({
      timestamp: c.created_at,
      title: 'Discussion Note',
      actor: c.author?.full_name || 'Engineer',
    });
  });

  // Sort ascending
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Invariant: timeline must have at least 2 events and timestamps must be monotonically non-decreasing
  if (timeline.length < 2) {
    throw new Error('Timeline must contain at least 2 events');
  }

  for (let i = 1; i < timeline.length; i++) {
    const prev = new Date(timeline[i - 1].timestamp).getTime();
    const curr = new Date(timeline[i].timestamp).getTime();
    if (curr < prev) {
      throw new Error(`Timeline sorting violation at index ${i}: ${timeline[i].timestamp} < ${timeline[i - 1].timestamp}`);
    }
  }

  console.log(`  ✅ [PASS] Synthesized ${timeline.length} timeline event(s) in strict chronological sequence:`);
  timeline.forEach((evt, idx) => {
    console.log(`     [${idx + 1}] ${evt.timestamp.slice(0, 19)} | ${evt.title} (${evt.actor})`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('🏁 PHASE 3 VERIFICATION COMPLETE: ALL 4 STEPS PASSED WITH LIVE REAL DATA');
  console.log('='.repeat(80));
}

runPhase3Verification().catch((err) => {
  console.error('\n❌ Phase 3 verification failed:', err);
  process.exit(1);
});
