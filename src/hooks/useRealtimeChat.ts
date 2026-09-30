import { useState, useEffect, useMemo } from 'react';
import { supabase, isLiveSupabaseConfigured } from '../lib/supabase';
import { 
  Channel, 
  Conversation, 
  Message, 
  Profile 
} from '../lib/database.types';

// Default seeded channels
const INITIAL_CHANNELS: Channel[] = [
  {
    id: 'ch-announcements',
    name: 'Mission Control Announcements',
    slug: 'announcements',
    channel_type: 'announcements',
    group_id: null,
    description: 'Official club-wide updates, competition deadlines, and general announcements. Read-only for engineers.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ch-pit-wall-heads',
    name: 'Pit Wall (Heads Only)',
    slug: 'pit-wall-heads',
    channel_type: 'heads_only',
    group_id: null,
    description: 'Cross-group leadership coordination channel for Sub-team Heads and Club Admins.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ch-vd',
    name: 'Vehicle Dynamics Telemetry',
    slug: 'ch-vehicle-dynamics',
    channel_type: 'group',
    group_id: '11111111-1111-1111-1111-111111111111',
    description: 'Suspension kinematics, steering, brake balance, and tire data discussion.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ch-aero',
    name: 'Aero CFD & Flight',
    slug: 'ch-aerodynamics',
    channel_type: 'group',
    group_id: '22222222-2222-2222-2222-222222222222',
    description: 'Front/rear wings, undertray diffusers, and OpenFOAM simulation data.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ch-elec',
    name: 'Low-Voltage Systems',
    slug: 'ch-electronics',
    channel_type: 'group',
    group_id: '33333333-3333-3333-3333-333333333333',
    description: 'CAN bus packet decoding, wiring harness, and telemetry dashboard.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ch-power',
    name: 'Powertrain & Torque',
    slug: 'ch-powertrain',
    channel_type: 'group',
    group_id: '44444444-4444-4444-4444-444444444444',
    description: 'Motor cooling, dyno testing, and drivetrain CAD modeling.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ch-ops',
    name: 'Operations & Sponsorship',
    slug: 'ch-business-ops',
    channel_type: 'group',
    group_id: '55555555-5555-5555-5555-555555555555',
    description: 'BOM cost accounting, sponsor presentations, and team logistics.',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-01',
    channel_id: 'ch-announcements',
    conversation_id: null,
    sender_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    content: '🏁 Welcome to the ZC PitLane Telemetry Workspace! Formula Student UK 2026 design freeze is in 45 days. Check sub-team deliverables.',
    attachment_url: null,
    attachment_name: null,
    attachment_type: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    sender: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      email: 'admin@zewailcity.edu.eg',
      full_name: 'Dr. Mostafa (Club Advisor)',
      avatar_url: null,
      phone: null,
      role: 'admin',
      group_id: null,
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  },
  {
    id: 'msg-02',
    channel_id: 'ch-pit-wall-heads',
    conversation_id: null,
    sender_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    content: 'Vehicle Dynamics has finalized the suspension hardpoints in Lotus Shark. Aero team can now run full car CFD with tire steering envelope.',
    attachment_url: null,
    attachment_name: null,
    attachment_type: null,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    sender: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      email: 'kareem.vd@zewailcity.edu.eg',
      full_name: 'Kareem Tarek (Head)',
      avatar_url: null,
      phone: null,
      role: 'head',
      group_id: '11111111-1111-1111-1111-111111111111',
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  },
  {
    id: 'msg-03',
    channel_id: 'ch-vd',
    conversation_id: null,
    sender_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    content: 'Working on the double wishbone kinematics deliverable now. Camber recovery looks solid at -1.4 deg in 2G cornering.',
    attachment_url: null,
    attachment_name: null,
    attachment_type: null,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    sender: {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      email: 'omar.member@zewailcity.edu.eg',
      full_name: 'Omar Sherif',
      avatar_url: null,
      phone: null,
      role: 'member',
      group_id: '11111111-1111-1111-1111-111111111111',
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
];

export function useRealtimeChat(currentUser: Profile | null, allProfiles: Profile[]) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('zcfs_chat_messages');
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  const [activeChannelId, setActiveChannelId] = useState<string>('ch-announcements');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('zcfs_conversations');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage in demo mode
  useEffect(() => {
    if (!isLiveSupabaseConfigured) {
      localStorage.setItem('zcfs_chat_messages', JSON.stringify(messages));
      localStorage.setItem('zcfs_conversations', JSON.stringify(conversations));
    }
  }, [messages, conversations]);

  // Compute channels visible to current user (enforcing RLS constraints in UI)
  const accessibleChannels = useMemo(() => {
    if (!currentUser || currentUser.status !== 'approved') return [];

    return INITIAL_CHANNELS.filter((ch) => {
      // 1. Announcements: everyone approved can view
      if (ch.channel_type === 'announcements') return true;

      // 2. Heads-Only: only Club Admin or Group Heads
      if (ch.channel_type === 'heads_only') {
        return currentUser.role === 'admin' || currentUser.role === 'head';
      }

      // 3. Group channel: Admin sees all; Head/Member sees ONLY own group
      if (ch.channel_type === 'group') {
        if (currentUser.role === 'admin') return true;
        return ch.group_id === currentUser.group_id;
      }

      return false;
    });
  }, [currentUser]);

  // If active channel became inaccessible after role switch, auto-switch to announcements
  useEffect(() => {
    if (!accessibleChannels.some((c) => c.id === activeChannelId) && !activeConversationId) {
      if (accessibleChannels.length > 0) {
        setActiveChannelId(accessibleChannels[0].id);
      }
    }
  }, [accessibleChannels, activeChannelId, activeConversationId]);

  // Realtime Supabase Subscription
  useEffect(() => {
    if (!isLiveSupabaseConfigured || !currentUser) return;

    // Load initial messages from Supabase
    const fetchSupabaseMessages = async () => {
      let query = supabase
        .from('messages')
        .select('*, sender:profiles(*)')
        .order('created_at', { ascending: true })
        .limit(100);

      const { data, error } = await query;
      if (!error && data) {
        setMessages(data);
      }
    };

    fetchSupabaseMessages();

    // Subscribe to new incoming messages
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          // Fetch sender profile for new message
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single();

          const incomingMsg: Message = {
            ...payload.new as any,
            sender: sender || undefined,
          };

          setMessages((prev) => [...prev, incomingMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Send message function
  const sendMessage = async (
    content: string,
    attachment?: { url: string; name: string; type: string }
  ) => {
    if (!currentUser) throw new Error('Must be logged in to send messages.');
    if (!content.trim()) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      channel_id: activeConversationId ? null : activeChannelId,
      conversation_id: activeConversationId || null,
      sender_id: currentUser.id,
      content: content.trim(),
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null,
      attachment_type: attachment?.type || null,
      created_at: new Date().toISOString(),
      sender: currentUser,
    };

    if (!isLiveSupabaseConfigured) {
      setMessages((prev) => [...prev, newMsg]);
      return;
    }

    const { error } = await supabase.from('messages').insert({
      channel_id: newMsg.channel_id,
      conversation_id: newMsg.conversation_id,
      sender_id: currentUser.id,
      content: newMsg.content,
      attachment_url: newMsg.attachment_url,
      attachment_name: newMsg.attachment_name,
      attachment_type: newMsg.attachment_type,
    });

    if (error) throw error;
  };

  // Start or get existing DM conversation with target user
  const startDirectMessage = (targetUserId: string) => {
    if (!currentUser) return;

    // Check if conversation exists
    const existing = conversations.find(
      (c) =>
        (c.participant_1 === currentUser.id && c.participant_2 === targetUserId) ||
        (c.participant_1 === targetUserId && c.participant_2 === currentUser.id)
    );

    if (existing) {
      setActiveConversationId(existing.id);
      setActiveChannelId('');
      return existing.id;
    }

    // Ensure participant_1 < participant_2 for database constraint
    const [p1, p2] = [currentUser.id, targetUserId].sort();
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      participant_1: p1,
      participant_2: p2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      other_participant: allProfiles.find((p) => p.id === targetUserId),
    };

    setConversations((prev) => [...prev, newConv]);
    setActiveConversationId(newConv.id);
    setActiveChannelId('');
    return newConv.id;
  };

  // Active messages for the currently selected channel or DM
  const currentMessages = useMemo(() => {
    if (activeConversationId) {
      return messages.filter((m) => m.conversation_id === activeConversationId);
    }
    return messages.filter((m) => m.channel_id === activeChannelId);
  }, [messages, activeChannelId, activeConversationId]);

  // Current active conversation / channel metadata
  const currentChannel = accessibleChannels.find((c) => c.id === activeChannelId);
  const currentConversation = conversations.find((c) => c.id === activeConversationId);
  const otherParticipant = currentConversation
    ? allProfiles.find(
        (p) =>
          p.id ===
          (currentConversation.participant_1 === currentUser?.id
            ? currentConversation.participant_2
            : currentConversation.participant_1)
      )
    : undefined;

  // Check if current user can write to the current target
  const canPostInCurrentTarget = useMemo(() => {
    if (!currentUser) return false;
    if (activeConversationId) return true; // DMs are always bidirectional
    if (!currentChannel) return false;

    // In announcements, only Head and Admin can post
    if (currentChannel.channel_type === 'announcements') {
      return currentUser.role === 'admin' || currentUser.role === 'head';
    }

    return true;
  }, [currentUser, activeConversationId, currentChannel]);

  return {
    accessibleChannels,
    activeChannelId,
    activeConversationId,
    setActiveChannel: (id: string) => {
      setActiveChannelId(id);
      setActiveConversationId(null);
    },
    setActiveConversation: (id: string) => {
      setActiveConversationId(id);
      setActiveChannelId('');
    },
    currentChannel,
    currentConversation,
    otherParticipant,
    conversations,
    currentMessages,
    sendMessage,
    startDirectMessage,
    canPost: canPostInCurrentTarget,
  };
}
