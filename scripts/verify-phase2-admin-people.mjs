import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function runPhase2Verification() {
  console.log('='.repeat(80));
  console.log('🏎️  PHASE 2 VERIFICATION: DEDICATED ADMIN PEOPLE MANAGEMENT');
  console.log('='.repeat(80));

  const adminEmail = 'admin_pitlane@zewailcity.edu.eg';
  const engineerEmail = 'engineer_aero@zewailcity.edu.eg';
  const password = 'SecurePassword2026!';

  // Step 1: Admin Authentication
  console.log('\n[1/5] Authenticating Club Admin...');
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

  // Step 2: Fetch and verify personnel directory access
  console.log('\n[2/5] Fetching personnel directory as Admin...');
  const { data: allProfiles, error: fetchErr } = await adminClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (fetchErr || !allProfiles) {
    throw new Error(`Failed to fetch profiles: ${fetchErr?.message}`);
  }
  console.log(`  ✅ [PASS] Admin fetched ${allProfiles.length} total user profiles.`);

  // Step 3: Reassign engineer to Aerodynamics and promote to Head
  console.log('\n[3/5] Testing sub-team reassignment + promotion (Member -> Head in Aero)...');
  const aeroGroupId = '22222222-2222-2222-2222-222222222222';
  const engProfile = allProfiles.find(p => p.email === engineerEmail);
  if (!engProfile) throw new Error('Test engineer profile not found in directory');

  const { error: promoErr } = await adminClient
    .from('profiles')
    .update({
      group_id: aeroGroupId,
      role: 'head',
      status: 'approved',
      updated_at: new Date().toISOString()
    })
    .eq('id', engProfile.id);

  if (promoErr) {
    throw new Error(`Failed to promote engineer: ${promoErr.message}`);
  }

  const { data: promoCheck } = await adminClient
    .from('profiles')
    .select('role, group_id, status')
    .eq('id', engProfile.id)
    .single();

  if (promoCheck.role !== 'head' || promoCheck.group_id !== aeroGroupId) {
    throw new Error('Promotion verification failed');
  }
  console.log(`  ✅ [PASS] Successfully promoted to Group Head in Aerodynamics (role=${promoCheck.role}, group=${promoCheck.group_id}).`);

  // Step 4: Test Safety Guard (Constraint rejection when role=head but group_id=null)
  console.log('\n[4/5] Testing constraint safety guard (reject role=head with null group)...');
  const { error: invalidErr } = await adminClient
    .from('profiles')
    .update({
      group_id: null,
      role: 'head'
    })
    .eq('id', engProfile.id);

  if (!invalidErr) {
    throw new Error('Database allowed invalid state: role=head with null group_id!');
  }
  console.log(`  ✅ [PASS] Database correctly blocked invalid role assignment: "${invalidErr.message}".`);

  // Step 5: Return engineer to Vehicle Dynamics as Member (clean baseline)
  console.log('\n[5/5] Re-setting engineer to clean baseline in Vehicle Dynamics...');
  const vdGroupId = '11111111-1111-1111-1111-111111111111';
  const { error: resetErr } = await adminClient
    .from('profiles')
    .update({
      group_id: vdGroupId,
      role: 'member',
      status: 'approved',
      updated_at: new Date().toISOString()
    })
    .eq('id', engProfile.id);

  if (resetErr) {
    throw new Error(`Failed to reset engineer: ${resetErr.message}`);
  }
  console.log('  ✅ [PASS] Clean baseline restored (Engineer -> Vehicle Dynamics Member).');

  console.log('\n' + '='.repeat(80));
  console.log('🏁 PHASE 2 VERIFICATION COMPLETE: ALL 5 STEPS PASSED');
  console.log('='.repeat(80));
}

runPhase2Verification().catch((err) => {
  console.error('\n❌ Phase 2 verification failed:', err);
  process.exit(1);
});
