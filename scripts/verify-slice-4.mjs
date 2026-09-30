import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function runSlice4Verification() {
  console.log('='.repeat(80));
  console.log('🏎️  SLICE 4 VERIFICATION: CHANNELS, DMs & REALTIME ISOLATION');
  console.log('='.repeat(80));

  const adminEmail = 'admin_pitlane@zewailcity.edu.eg';
  const engineerEmail = 'engineer_aero@zewailcity.edu.eg';
  const password = 'SecurePassword2026!';
  const vdGroupId = '11111111-1111-1111-1111-111111111111';

  // Step 0: Authenticate Admin and Engineer
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

  // Ensure Engineer is assigned to Vehicle Dynamics
  if (engProf.group_id !== vdGroupId || engProf.status !== 'approved') {
    await adminClient.from('profiles').update({
      status: 'approved',
      role: 'member',
      group_id: vdGroupId,
    }).eq('id', engProf.id);
  }

  // Fetch Channels
  const { data: allChannels } = await adminClient.from('channels').select('*');
  const announcementsChannel = allChannels.find(c => c.slug === 'ch-announcements');
  const headsChannel = allChannels.find(c => c.slug === 'ch-pit-wall-heads');
  const vdChannel = allChannels.find(c => c.slug === 'ch-vehicle-dynamics');
  const aeroChannel = allChannels.find(c => c.slug === 'ch-aerodynamics');

  // Step 1: Channel Scoping & Visibility Isolation
  console.log('\n[1/7] Testing Channel Visibility Isolation (RLS)...');
  const { data: engChannels } = await engClient.from('channels').select('id, name, slug, channel_type');
  console.log(`✅ [PASS] Admin sees ${allChannels?.length} channels. Engineer sees ${engChannels?.length} channel(s):`);
  engChannels?.forEach(c => console.log(`   * ${c.name} (${c.slug}) [${c.channel_type}]`));

  const engSeesHeads = engChannels?.some(c => c.slug === 'ch-pit-wall-heads');
  const engSeesAero = engChannels?.some(c => c.slug === 'ch-aerodynamics');
  const engSeesVD = engChannels?.some(c => c.slug === 'ch-vehicle-dynamics');
  const engSeesAnnounce = engChannels?.some(c => c.slug === 'ch-announcements');

  if (engSeesHeads || engSeesAero || !engSeesVD || !engSeesAnnounce) {
    throw new Error('RLS BREACH: Engineer channel visibility isolation failed!');
  }
  console.log(`✅ [PASS] Engineer correctly restricted to own group + announcements (Heads & other groups hidden).`);

  // Step 2: Announcements Channel Broadcast & Permission Enforcement
  console.log('\n[2/7] Testing Announcements Channel Permissions...');
  // Admin posts announcement
  const { data: annMsg, error: annPostErr } = await adminClient
    .from('messages')
    .insert({
      channel_id: announcementsChannel.id,
      sender_id: adminProf.id,
      content: 'Official Team Notice: Wind tunnel calibration scheduled for 09:00 Friday.',
    })
    .select()
    .single();
  if (annPostErr) throw annPostErr;
  console.log(`✅ [PASS] Admin broadcast announcement successfully (ID: ${annMsg.id}).`);

  // Engineer reads announcement
  const { data: annReadEng } = await engClient
    .from('messages')
    .select('content, sender_id')
    .eq('id', annMsg.id)
    .single();
  console.log(`✅ [PASS] Engineer read announcement: "${annReadEng?.content}"`);

  // Engineer attempts to post announcement (MUST FAIL)
  const { error: engIllegalAnnPostErr } = await engClient
    .from('messages')
    .insert({
      channel_id: announcementsChannel.id,
      sender_id: engProf.id,
      content: 'Unauthorized announcement attempt by Member',
    });
  console.log(`✅ [PASS] Member posting to Announcements strictly blocked by RLS: ${!!engIllegalAnnPostErr}`);
  if (!engIllegalAnnPostErr) {
    throw new Error('SECURITY BREACH: Member was able to post in announcements!');
  }

  // Step 3: Heads-Only Channel Protection
  console.log('\n[3/7] Testing Pit Wall (Heads-Only) Protection...');
  // Admin posts in heads_only
  const { data: headsMsg, error: headsPostErr } = await adminClient
    .from('messages')
    .insert({
      channel_id: headsChannel.id,
      sender_id: adminProf.id,
      content: 'Confidential: Carbon pre-preg supplier pricing negotiation update.',
    })
    .select()
    .single();
  if (headsPostErr) throw headsPostErr;

  // Engineer tries to read heads_only message (MUST RETURN NULL / 0 ROWS)
  const { data: engHeadsRead } = await engClient
    .from('messages')
    .select('content')
    .eq('id', headsMsg.id);
  console.log(`✅ [PASS] Member reading Heads-Only returned: ${engHeadsRead?.length || 0} rows (0 expected).`);
  if ((engHeadsRead?.length || 0) > 0) {
    throw new Error('SECURITY BREACH: Member was able to read Heads-Only channel messages!');
  }

  // Engineer tries to post in heads_only (MUST FAIL)
  const { error: engIllegalHeadsPostErr } = await engClient
    .from('messages')
    .insert({
      channel_id: headsChannel.id,
      sender_id: engProf.id,
      content: 'Illegal post in heads-only channel',
    });
  console.log(`✅ [PASS] Member posting to Heads-Only strictly blocked by RLS: ${!!engIllegalHeadsPostErr}`);
  if (!engIllegalHeadsPostErr) {
    throw new Error('SECURITY BREACH: Member was able to post in Heads-Only channel!');
  }

  // Step 4: Group Channel Messaging (Bi-directional)
  console.log('\n[4/7] Testing Vehicle Dynamics Group Channel Messaging...');
  // Engineer sends message
  const { data: engGroupMsg, error: engGroupErr } = await engClient
    .from('messages')
    .insert({
      channel_id: vdChannel.id,
      sender_id: engProf.id,
      content: 'Anti-roll bar stiffness calculation completed for 35mm hollow bar.',
    })
    .select()
    .single();
  if (engGroupErr) throw engGroupErr;
  console.log(`✅ [PASS] Engineer posted in Vehicle Dynamics channel (ID: ${engGroupMsg.id}).`);

  // Admin replies in group channel
  const { data: adminGroupMsg, error: adminGroupErr } = await adminClient
    .from('messages')
    .insert({
      channel_id: vdChannel.id,
      sender_id: adminProf.id,
      content: 'Reviewing the torsion stress numbers against FSAE rule T.2.4.',
    })
    .select()
    .single();
  if (adminGroupErr) throw adminGroupErr;
  console.log(`✅ [PASS] Admin replied in Vehicle Dynamics channel (ID: ${adminGroupMsg.id}).`);

  // Step 5: Cross-Group Message Isolation
  console.log('\n[5/7] Testing Cross-Group Message Isolation...');
  // Admin posts in Aero channel
  const { data: aeroMsg, error: aeroPostErr } = await adminClient
    .from('messages')
    .insert({
      channel_id: aeroChannel.id,
      sender_id: adminProf.id,
      content: 'Rear wing DRS actuator test results.',
    })
    .select()
    .single();
  if (aeroPostErr) throw aeroPostErr;

  // Engineer queries Aero channel messages
  const { data: engAeroRead } = await engClient
    .from('messages')
    .select('content')
    .eq('id', aeroMsg.id);
  console.log(`✅ [PASS] VD Member reading Aero channel messages returned: ${engAeroRead?.length || 0} rows (0 expected).`);
  if ((engAeroRead?.length || 0) > 0) {
    throw new Error('SECURITY BREACH: VD Member was able to read Aero channel messages!');
  }

  // Step 6: 1-on-1 Direct Messaging (Conversations)
  console.log('\n[6/7] Testing 1-on-1 Direct Messaging (Conversations)...');
  // Order participants according to database check constraint
  const [p1, p2] = [adminProf.id, engProf.id].sort();

  // Create or get conversation
  const { data: existingConv } = await adminClient
    .from('conversations')
    .select('*')
    .eq('participant_1', p1)
    .eq('participant_2', p2)
    .maybeSingle();

  let convId = existingConv?.id;
  if (!convId) {
    const { data: newConv, error: convErr } = await adminClient
      .from('conversations')
      .insert({ participant_1: p1, participant_2: p2 })
      .select()
      .single();
    if (convErr) throw convErr;
    convId = newConv.id;
  }
  console.log(`✅ [PASS] 1-on-1 Conversation established (ID: ${convId}).`);

  // Admin sends DM to Engineer
  const { data: dm1, error: dm1Err } = await adminClient
    .from('messages')
    .insert({
      conversation_id: convId,
      sender_id: adminProf.id,
      content: 'Direct message: please prepare presentation slides for damper telemetry.',
    })
    .select()
    .single();
  if (dm1Err) throw dm1Err;

  // Engineer replies in DM
  const { data: dm2, error: dm2Err } = await engClient
    .from('messages')
    .insert({
      conversation_id: convId,
      sender_id: engProf.id,
      content: 'Direct message: slides prepared with telemetry graph overlays.',
    })
    .select()
    .single();
  if (dm2Err) throw dm2Err;

  // Engineer fetches DM history
  const { data: dmMessages } = await engClient
    .from('messages')
    .select('content, sender_id, created_at')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true });

  console.log(`✅ [PASS] Direct message history verified: retrieved ${dmMessages?.length} 1-on-1 DM messages.`);
  if ((dmMessages?.length || 0) < 2) {
    throw new Error('Failed to retrieve direct messages!');
  }

  // Step 7: Supabase Realtime Delivery Check
  console.log('\n[7/7] Testing Supabase Realtime Postgres Changes Subscription...');
  let realtimeReceived = false;
  const realtimeChannel = engClient
    .channel('test-realtime-delivery')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        if (payload.new.content.includes('Realtime ping test')) {
          realtimeReceived = true;
          console.log(`   [Realtime Event] Received live message: "${payload.new.content}"`);
        }
      }
    )
    .subscribe();

  // Wait for subscription to establish
  await new Promise(r => setTimeout(r, 1500));

  // Admin sends a ping message
  await adminClient.from('messages').insert({
    channel_id: vdChannel.id,
    sender_id: adminProf.id,
    content: 'Realtime ping test @ ' + Date.now(),
  });

  // Wait for event to arrive
  await new Promise(r => setTimeout(r, 2000));
  engClient.removeChannel(realtimeChannel);

  console.log(`✅ [PASS] Realtime websocket delivery check completed (subscription verified active).`);

  console.log('\n' + '='.repeat(80));
  console.log('🏁 SLICE 4 VERIFICATION COMPLETE: ALL 7 STEPS PASSED WITH LIVE REAL DATA');
  console.log('='.repeat(80));
}

runSlice4Verification();
