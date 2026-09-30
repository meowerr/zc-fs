import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, isLiveSupabaseConfigured, isDemoMode } from '../lib/supabase';
import { INITIAL_CHANNELS, INITIAL_MESSAGES } from '../lib/demoData';
import { 
  Channel, 
  Conversation, 
  Message, 
  Profile 
} from '../lib/database.types';

export function useRealtimeChat(currentUser: Profile | null, allProfiles: Profile[]) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!isDemoMode) return [];
    const saved = localStorage.getItem('zcfs_chat_messages');
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  const [channels, setChannels] = useState<Channel[]>(() => {
    if (!isDemoMode) return [];
    return INITIAL_CHANNELS;
  });

  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (!isDemoMode) return [];
    const saved = localStorage.getItem('zcfs_conversations');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage in demo mode
  useEffect(() => {
    if (!isLiveSupabaseConfigured && isDemoMode) {
      localStorage.setItem('zcfs_chat_messages', JSON.stringify(messages));
      localStorage.setItem('zcfs_conversations', JSON.stringify(conversations));
    }
  }, [messages, conversations]);

  // Load Channels & Conversations from Supabase
  const loadChatMetadata = useCallback(async () => {
    if (!isLiveSupabaseConfigured || !currentUser || currentUser.status !== 'approved') return;

    try {
      // 1. Fetch authorized channels (RLS enforces visibility)
      const { data: channelData, error: chanErr } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true });

      if (!chanErr && channelData) {
        setChannels(channelData);
        // Default to announcements channel if none active
        if (!activeChannelId && !activeConversationId) {
          const ann = channelData.find((c) => c.channel_type === 'announcements') || channelData[0];
          if (ann) setActiveChannelId(ann.id);
        }
      }

      // 2. Fetch conversations
      const { data: convData, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!convErr && convData) {
        const enriched = convData.map((c) => ({
          ...c,
          other_participant: allProfiles.find(
            (p) => p.id === (c.participant_1 === currentUser.id ? c.participant_2 : c.participant_1)
          ),
        }));
        setConversations(enriched);
      }
    } catch (err) {
      console.error('Failed to load chat metadata:', err);
    }
  }, [currentUser, allProfiles, activeChannelId, activeConversationId]);

  useEffect(() => {
    loadChatMetadata();
  }, [loadChatMetadata]);

  // Compute channels visible to current user (enforcing RLS constraints in UI)
  const accessibleChannels: Channel[] = useMemo(() => {
    if (!currentUser || currentUser.status !== 'approved') return [];

    if (isLiveSupabaseConfigured) {
      return channels;
    }

    return INITIAL_CHANNELS.filter((ch) => {
      if (ch.channel_type === 'announcements') return true;
      if (ch.channel_type === 'heads_only') {
        return currentUser.role === 'admin' || currentUser.role === 'head';
      }
      if (ch.channel_type === 'group') {
        if (currentUser.role === 'admin') return true;
        return ch.group_id === currentUser.group_id;
      }
      return false;
    });
  }, [currentUser, channels]);

  // If active channel became inaccessible after role switch, auto-switch to first accessible
  useEffect(() => {
    if (accessibleChannels.length > 0 && !activeConversationId) {
      const isCurrentValid = accessibleChannels.some((c) => c.id === activeChannelId);
      if (!isCurrentValid) {
        setActiveChannelId(accessibleChannels[0].id);
      }
    }
  }, [accessibleChannels, activeChannelId, activeConversationId]);

  // Realtime Supabase Subscription
  useEffect(() => {
    if (!isLiveSupabaseConfigured || !currentUser || currentUser.status !== 'approved') return;

    // Load initial messages from Supabase
    const fetchSupabaseMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .order('created_at', { ascending: true })
        .limit(200);

      if (!error && data) {
        setMessages(data);
      }
    };

    fetchSupabaseMessages();

    // Subscribe to new incoming messages and conversations
    const channel = supabase
      .channel('public:messages_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single();

          const incomingMsg: Message = {
            ...(payload.new as any),
            sender: sender || undefined,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === incomingMsg.id)) return prev;
            return [...prev, incomingMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          loadChatMetadata();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, loadChatMetadata]);

  // Send message function
  const sendMessage = async (
    content: string,
    attachment?: { url: string; name: string; type: string }
  ) => {
    if (!currentUser) throw new Error('Must be logged in to send messages.');
    if (!content.trim()) return;

    const trimmed = content.trim();

    if (!isLiveSupabaseConfigured) {
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        channel_id: activeConversationId ? null : activeChannelId,
        conversation_id: activeConversationId || null,
        sender_id: currentUser.id,
        content: trimmed,
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
        attachment_type: attachment?.type || null,
        created_at: new Date().toISOString(),
        sender: currentUser,
      };
      setMessages((prev) => [...prev, newMsg]);
      return;
    }

    const { error } = await supabase.from('messages').insert({
      channel_id: activeConversationId ? null : activeChannelId,
      conversation_id: activeConversationId || null,
      sender_id: currentUser.id,
      content: trimmed,
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null,
      attachment_type: attachment?.type || null,
    });

    if (error) throw error;
  };

  // Start or get existing DM conversation with target user
  const startDirectMessage = async (targetUserId: string) => {
    if (!currentUser) return;

    // Check if conversation already exists in state
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

    if (!isLiveSupabaseConfigured) {
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
    }

    // Live Supabase conversation creation / lookup
    const { data: dbConv, error: convErr } = await supabase
      .from('conversations')
      .insert({ participant_1: p1, participant_2: p2 })
      .select()
      .single();

    if (convErr) {
      // If already exists, fetch it
      const { data: existingDb } = await supabase
        .from('conversations')
        .select('*')
        .eq('participant_1', p1)
        .eq('participant_2', p2)
        .single();

      if (existingDb) {
        setActiveConversationId(existingDb.id);
        setActiveChannelId('');
        return existingDb.id;
      }
      throw convErr;
    }

    if (dbConv) {
      await loadChatMetadata();
      setActiveConversationId(dbConv.id);
      setActiveChannelId('');
      return dbConv.id;
    }
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
    if (activeConversationId) return true; // DMs are bidirectional
    if (!currentChannel) return false;

    // In announcements, only Head and Admin can post
    if (currentChannel.channel_type === 'announcements') {
      return currentUser.role === 'admin' || currentUser.role === 'head';
    }

    // In heads-only, only Head and Admin can post
    if (currentChannel.channel_type === 'heads_only') {
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
