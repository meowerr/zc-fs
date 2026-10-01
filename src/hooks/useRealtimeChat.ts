import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

  // Keep stable refs to avoid tearing down WebSocket subscriptions on profile updates
  const allProfilesRef = useRef<Profile[]>(allProfiles);
  useEffect(() => {
    allProfilesRef.current = allProfiles;
  }, [allProfiles]);

  const currentUserRef = useRef<Profile | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Save to localStorage in demo mode
  useEffect(() => {
    if (!isLiveSupabaseConfigured && isDemoMode) {
      localStorage.setItem('zcfs_chat_messages', JSON.stringify(messages));
      localStorage.setItem('zcfs_conversations', JSON.stringify(conversations));
    }
  }, [messages, conversations]);

  // Smart default channel selection based on role and group assignment
  const getSmartDefaultChannel = useCallback((availableChannels: Channel[], user: Profile): string => {
    if (!availableChannels.length) return '';

    // 1. If Member: Prioritize their assigned sub-team group channel (so they can immediately chat!)
    if (user.role === 'member' && user.group_id) {
      const memberGroup = availableChannels.find(
        (c) => c.channel_type === 'group' && c.group_id === user.group_id
      );
      if (memberGroup) return memberGroup.id;
    }

    // 2. If Head: Prioritize their sub-team group channel, or heads-only channel
    if (user.role === 'head') {
      if (user.group_id) {
        const headGroup = availableChannels.find(
          (c) => c.channel_type === 'group' && c.group_id === user.group_id
        );
        if (headGroup) return headGroup.id;
      }
      const headsChan = availableChannels.find((c) => c.channel_type === 'heads_only');
      if (headsChan) return headsChan.id;
    }

    // 3. If Admin: Prioritize heads-only or first group channel
    if (user.role === 'admin') {
      const headsChan = availableChannels.find((c) => c.channel_type === 'heads_only');
      if (headsChan) return headsChan.id;
    }

    // 4. Fallback: First writable channel (where user is allowed to post)
    const writable = availableChannels.find((c) => {
      if (c.channel_type === 'announcements') return user.role === 'admin' || user.role === 'head';
      if (c.channel_type === 'heads_only') return user.role === 'admin' || user.role === 'head';
      return c.group_id === user.group_id || user.role === 'admin';
    });
    if (writable) return writable.id;

    // 5. Final fallback: First available channel
    return availableChannels[0].id;
  }, []);

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

  // Demo mode smart default initialization
  useEffect(() => {
    if (!isLiveSupabaseConfigured && currentUser && !activeChannelId && !activeConversationId) {
      if (accessibleChannels.length > 0) {
        setActiveChannelId(getSmartDefaultChannel(accessibleChannels, currentUser));
      }
    }
  }, [currentUser, accessibleChannels, activeChannelId, activeConversationId, getSmartDefaultChannel]);

  // Load Channels & Conversations from Supabase (decoupled from activeChannelId/activeConversationId)
  const loadChatMetadata = useCallback(async () => {
    if (!isLiveSupabaseConfigured || !currentUser || currentUser.status !== 'approved') return;

    try {
      // 1. Fetch authorized channels (RLS enforces visibility)
      const { data: channelData, error: chanErr } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true });

      if (!chanErr && channelData && channelData.length > 0) {
        setChannels(channelData);
        // Smart default if none currently active
        setActiveChannelId((prevId) => {
          if (prevId) {
            const exists = channelData.some((c) => c.id === prevId);
            if (exists) return prevId;
          }
          return getSmartDefaultChannel(channelData, currentUser);
        });
      }

      // 2. Fetch conversations
      const { data: convData, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!convErr && convData) {
        const enriched = convData.map((c) => ({
          ...c,
          other_participant: allProfilesRef.current.find(
            (p) => p.id === (c.participant_1 === currentUser.id ? c.participant_2 : c.participant_1)
          ),
        }));
        setConversations(enriched);
      }
    } catch (err) {
      console.error('Failed to load chat metadata:', err);
    }
  }, [currentUser?.id, currentUser?.status, currentUser?.role, currentUser?.group_id, getSmartDefaultChannel]);

  useEffect(() => {
    loadChatMetadata();
  }, [loadChatMetadata]);

  // If active channel became inaccessible after role or group switch, auto-switch to smart default
  useEffect(() => {
    if (accessibleChannels.length > 0 && !activeConversationId && currentUser) {
      const isCurrentValid = accessibleChannels.some((c) => c.id === activeChannelId);
      if (!isCurrentValid) {
        setActiveChannelId(getSmartDefaultChannel(accessibleChannels, currentUser));
      }
    }
  }, [accessibleChannels, activeChannelId, activeConversationId, currentUser, getSmartDefaultChannel]);

  // Realtime Supabase Subscription: Stable lifecycle bound only to currentUser session
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

    // Unique channel topic name to avoid socket collision
    const channelTopic = `chat_${currentUser.id}_${Math.random().toString(36).substring(2, 8)}`;
    const channel = supabase
      .channel(channelTopic)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMsg = payload.new as any;
          // Synchronously resolve sender from in-memory profiles or currentUser
          let sender = (newMsg.sender_id === currentUser.id)
            ? currentUserRef.current
            : allProfilesRef.current.find((p) => p.id === newMsg.sender_id);

          // If sender not found in memory, query profile as fallback
          if (!sender) {
            const { data: dbSender } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newMsg.sender_id)
              .single();
            if (dbSender) sender = dbSender;
          }

          const incomingMsg: Message = {
            ...newMsg,
            sender: sender || undefined,
          };

          setMessages((prev) => {
            // Reconcile optimistic messages (either by confirmed ID or temp client ID)
            const existingIndex = prev.findIndex(
              (m) =>
                m.id === incomingMsg.id ||
                (m.id.startsWith('temp-') &&
                  m.sender_id === incomingMsg.sender_id &&
                  m.content === incomingMsg.content &&
                  (m.channel_id === incomingMsg.channel_id || m.conversation_id === incomingMsg.conversation_id))
            );
            if (existingIndex !== -1) {
              const updated = [...prev];
              updated[existingIndex] = incomingMsg;
              return updated;
            }
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
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Chat realtime channel error:', err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, currentUser?.status, loadChatMetadata]);

  // Send message function with instant optimistic UI update
  const sendMessage = async (
    content: string,
    attachment?: { url: string; name: string; type: string }
  ) => {
    if (!currentUser) throw new Error('Must be logged in to send messages.');
    if (!content.trim() && !attachment?.url) return;

    const trimmed = content.trim();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let channelId = activeConversationId ? null : activeChannelId;
    let conversationId = activeConversationId || null;

    if (!channelId && !conversationId) {
      const fallbackId = getSmartDefaultChannel(accessibleChannels, currentUser);
      if (fallbackId) {
        channelId = fallbackId;
        setActiveChannelId(fallbackId);
      } else {
        throw new Error('No active channel or conversation selected.');
      }
    }

    const optimisticMsg: Message = {
      id: tempId,
      channel_id: channelId,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: trimmed,
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null,
      attachment_type: attachment?.type || null,
      created_at: new Date().toISOString(),
      sender: currentUser,
    };

    // Optimistically add message to state immediately for zero-lag rendering
    setMessages((prev) => [...prev, optimisticMsg]);

    if (!isLiveSupabaseConfigured) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          channel_id: channelId,
          conversation_id: conversationId,
          sender_id: currentUser.id,
          content: trimmed,
          attachment_url: attachment?.url || null,
          attachment_type: attachment?.type || null,
        })
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .single();

      if (error) {
        // Rollback optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        throw error;
      }

      if (data) {
        // Replace temp message with server record
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === tempId || m.id === data.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = data;
            return next;
          }
          return [...prev, data];
        });
      }
    } catch (err) {
      // Ensure rollback on any exception
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      throw err;
    }
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
        other_participant: allProfilesRef.current.find((p) => p.id === targetUserId),
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
        const enriched: Conversation = {
          ...existingDb,
          other_participant: allProfilesRef.current.find((p) => p.id === targetUserId),
        };
        setConversations((prev) => {
          if (prev.some((c) => c.id === enriched.id)) return prev;
          return [enriched, ...prev];
        });
        setActiveConversationId(existingDb.id);
        setActiveChannelId('');
        return existingDb.id;
      }
      throw convErr;
    }

    if (dbConv) {
      const enriched: Conversation = {
        ...dbConv,
        other_participant: allProfilesRef.current.find((p) => p.id === targetUserId),
      };
      setConversations((prev) => [enriched, ...prev]);
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
    ? allProfilesRef.current.find(
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

    // In group channels: Admins can post anywhere, members can post in their group
    if (currentChannel.channel_type === 'group') {
      if (currentUser.role === 'admin') return true;
      return currentChannel.group_id === currentUser.group_id;
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
