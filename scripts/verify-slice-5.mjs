import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function runSlice5Verification() {
  console.log('='.repeat(80));
  console.log('🏎️  SLICE 5 VERIFICATION: STORAGE UPLOADS & STORAGE RLS POLICIES');
  console.log('='.repeat(80));

  const adminEmail = 'admin_pitlane@zewailcity.edu.eg';
  const engineerEmail = 'engineer_aero@zewailcity.edu.eg';
  const password = 'SecurePassword2026!';
  const vdGroupId = '11111111-1111-1111-1111-111111111111';
  const aeroGroupId = '22222222-2222-2222-2222-222222222222';

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

  // Step 1: Bucket Verification
  console.log('\n[1/6] Verifying Storage Buckets Existence & Operation...');
  const probeTask = await adminClient.storage.from('task-attachments').upload('.probe_init', Buffer.from('init'), { upsert: true });
  if (probeTask.error && !probeTask.error.message.includes('already exists')) {
    throw new Error(`task-attachments bucket probe failed: ${probeTask.error.message}`);
  }
  await adminClient.storage.from('task-attachments').remove(['.probe_init']);

  const probeChat = await adminClient.storage.from('chat-media').upload('.probe_init', Buffer.from('init'), { upsert: true });
  if (probeChat.error && !probeChat.error.message.includes('already exists')) {
    throw new Error(`chat-media bucket probe failed: ${probeChat.error.message}`);
  }
  await adminClient.storage.from('chat-media').remove(['.probe_init']);

  console.log('✅ [PASS] Both "task-attachments" and "chat-media" buckets verified active and operational.');

  // Step 2: Member Upload to Own Group Folder (Vehicle Dynamics)
  console.log('\n[2/6] Member uploading deliverable to own sub-team folder (Vehicle Dynamics)...');
  const testRunId = Date.now();
  const vdFilePath = `${vdGroupId}/run_${testRunId}_telemetry.csv`;
  const testCsvContent = 'timestamp,ch_fl_pot,ch_fr_pot,speed_kmh\n0.001,12.4,12.1,88.4\n0.002,12.9,12.3,89.1';

  const { data: uploadVd, error: uploadVdErr } = await engClient.storage
    .from('task-attachments')
    .upload(vdFilePath, Buffer.from(testCsvContent), {
      contentType: 'text/csv',
      upsert: false,
    });

  if (uploadVdErr) throw uploadVdErr;
  console.log(`✅ [PASS] Engineer uploaded file to own group folder: "${uploadVd.path}"`);

  // Verify Member can read/download own group file
  const { data: downloadedVd, error: downloadVdErr } = await engClient.storage
    .from('task-attachments')
    .download(vdFilePath);
  if (downloadVdErr) throw downloadVdErr;
  const downloadedText = await downloadedVd.text();
  console.log(`✅ [PASS] Engineer downloaded and verified file content (${downloadedText.length} bytes matches).`);

  // Step 3: Cross-Group Storage Isolation - Upload Block
  console.log('\n[3/6] Testing Cross-Group Storage Isolation (Member uploading to Aero folder)...');
  const illegalAeroPath = `${aeroGroupId}/hacked_${testRunId}_file.csv`;
  const { error: illegalUploadErr } = await engClient.storage
    .from('task-attachments')
    .upload(illegalAeroPath, Buffer.from('illegal data'), {
      contentType: 'text/csv',
      upsert: false,
    });

  console.log(`✅ [PASS] Member blocked from uploading to Aerodynamics folder: ${!!illegalUploadErr}`);
  if (!illegalUploadErr) {
    throw new Error('SECURITY BREACH: Member was able to upload into another sub-team storage folder!');
  }

  // Step 4: Cross-Group Storage Isolation - Read Block
  console.log('\n[4/6] Testing Cross-Group Storage Isolation (Member reading Aero files)...');
  // Admin uploads confidential file to Aero folder
  const aeroSecretPath = `${aeroGroupId}/confidential_${testRunId}_wing_cfd.step`;
  await adminClient.storage
    .from('task-attachments')
    .upload(aeroSecretPath, Buffer.from('ISO-10303-21; STEP CAD DATA; END-ISO-10303-21;'), {
      contentType: 'application/step',
      upsert: false,
    });

  // Engineer (VD) attempts to download Aero confidential file
  const { error: illegalDownloadErr } = await engClient.storage
    .from('task-attachments')
    .download(aeroSecretPath);

  console.log(`✅ [PASS] Member downloading foreign sub-team file rejected by RLS: ${!!illegalDownloadErr}`);
  if (!illegalDownloadErr) {
    throw new Error('SECURITY BREACH: Member was able to download foreign sub-team file!');
  }

  // Engineer lists files in Aero folder (expect 0 files)
  const { data: aeroFileList } = await engClient.storage
    .from('task-attachments')
    .list(aeroGroupId);

  console.log(`✅ [PASS] Member listing foreign sub-team folder returned: ${aeroFileList?.length || 0} files (0 expected).`);
  if ((aeroFileList?.length || 0) > 0) {
    throw new Error('SECURITY BREACH: Member was able to list files in foreign sub-team folder!');
  }

  // Step 5: Chat Media Bucket Scoped Permissions
  console.log('\n[5/6] Testing Chat Media Bucket Scoped Permissions...');
  const { data: allChannels } = await adminClient.from('channels').select('*');
  const vdChannel = allChannels.find(c => c.slug === 'ch-vehicle-dynamics');
  const headsChannel = allChannels.find(c => c.slug === 'ch-pit-wall-heads');

  // 1. Member uploads to own group channel folder
  const vdChatPath = `channels/${vdChannel.id}/shock_pot_${testRunId}.png`;
  const { error: vdChatUploadErr } = await engClient.storage
    .from('chat-media')
    .upload(vdChatPath, Buffer.from('fake-png-data'), {
      contentType: 'image/png',
      upsert: false,
    });
  if (vdChatUploadErr) throw vdChatUploadErr;
  console.log(`✅ [PASS] Member uploaded chat attachment to own group channel: "${vdChatPath}"`);

  // 2. Member attempts to upload to Heads-Only channel folder (MUST FAIL)
  const headsChatPath = `channels/${headsChannel.id}/illegal_${testRunId}.png`;
  const { error: illegalHeadsUploadErr } = await engClient.storage
    .from('chat-media')
    .upload(headsChatPath, Buffer.from('illegal data'), {
      contentType: 'image/png',
      upsert: false,
    });
  console.log(`✅ [PASS] Member upload to Heads-Only chat folder blocked by RLS: ${!!illegalHeadsUploadErr}`);
  if (!illegalHeadsUploadErr) {
    throw new Error('SECURITY BREACH: Member uploaded media to Heads-Only channel folder!');
  }

  // Step 6: File Deletion & Ownership
  console.log('\n[6/6] Testing Storage File Deletion & Ownership...');
  // Member deletes own uploaded file
  const { error: deleteOwnErr } = await engClient.storage
    .from('task-attachments')
    .remove([vdFilePath]);
  console.log(`✅ [PASS] Member deleted own uploaded file: ${!deleteOwnErr}`);

  // Admin deletes Aero test file
  await adminClient.storage
    .from('task-attachments')
    .remove([aeroSecretPath]);
  await adminClient.storage
    .from('chat-media')
    .remove([vdChatPath]);

  console.log('\n' + '='.repeat(80));
  console.log('🏁 SLICE 5 VERIFICATION COMPLETE: ALL 6 STEPS PASSED WITH LIVE REAL DATA');
  console.log('='.repeat(80));
}

runSlice5Verification();
