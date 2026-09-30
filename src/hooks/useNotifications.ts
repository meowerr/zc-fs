import { useState, useEffect, useCallback } from 'react';
import { supabase, isLiveSupabaseConfigured, isDemoMode } from '../lib/supabase';
import { NotificationItem, NotificationType, Profile } from '../lib/database.types';
import { playTelemetrySound } from '../lib/telemetryAudio';
import { INITIAL_NOTIFICATIONS } from '../lib/demoData';

export interface ToastItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

export function useNotifications(currentUser: Profile | null) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (!isDemoMode) return [];
    const saved = localStorage.getItem('zcfs_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => {
    return localStorage.getItem('zcfs_audio_muted') === 'true';
  });

  // Save to localStorage in demo mode
  useEffect(() => {
    if (!isLiveSupabaseConfigured && isDemoMode) {
      localStorage.setItem('zcfs_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Load notifications from Supabase
  const loadNotifications = useCallback(async () => {
    if (!isLiveSupabaseConfigured || !currentUser || currentUser.status !== 'approved') return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted: NotificationItem[] = data.map((n: any) => ({
          id: n.id,
          user_id: n.user_id,
          type: n.notification_type,
          title: n.title,
          message: n.body,
          link: n.link_url,
          is_read: n.is_read,
          created_at: n.created_at,
        }));
        setNotifications(formatted);
      }
    } catch (err) {
      console.error('Failed to load notifications from Supabase:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Realtime notification listener
  useEffect(() => {
    if (!isLiveSupabaseConfigured || !currentUser || currentUser.status !== 'approved') return;

    const channel = supabase
      .channel(`public:notifications:${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, loadNotifications]);

  const toggleMute = () => {
    setIsAudioMuted((prev) => {
      const next = !prev;
      localStorage.setItem('zcfs_audio_muted', String(next));
      return next;
    });
  };

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addNotification = useCallback(
    async (
      type: NotificationType,
      title: string,
      message: string,
      link: string | null = null,
      targetUserId?: string
    ) => {
      const recipientId = targetUserId || currentUser?.id;
      if (!recipientId) return;

      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        user_id: recipientId,
        type,
        title,
        message,
        link,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      // In demo mode or local fallback
      if (!isLiveSupabaseConfigured) {
        setNotifications((prev) => [newNotif, ...prev]);
      } else {
        // Live Supabase Insert
        const { error } = await supabase.from('notifications').insert({
          user_id: recipientId,
          notification_type: type,
          title,
          body: message,
          link_url: link,
          is_read: false,
        });

        if (error) {
          console.warn('Notification insert notice:', error.message);
        }
        await loadNotifications();
      }

      // Add toast banner
      const toastId = `toast-${Date.now()}`;
      setToasts((prev) => [...prev, { id: toastId, type, title, message }]);

      // Synthesize telemetry audio chime
      if (!isAudioMuted) {
        if (type === 'review_result' && message.toLowerCase().includes('approved')) {
          playTelemetrySound('success');
        } else if (type === 'task_due_soon') {
          playTelemetrySound('alert');
        } else {
          playTelemetrySound('chime');
        }
      }

      // Auto-dismiss toast after 4.5s
      setTimeout(() => {
        removeToast(toastId);
      }, 4500);
    },
    [currentUser, isAudioMuted, loadNotifications, removeToast]
  );

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    if (isLiveSupabaseConfigured) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    if (isLiveSupabaseConfigured && currentUser) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', currentUser.id)
        .eq('is_read', false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Request browser Web Push notifications
  const requestWebPush = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        addNotification('announcement', 'Web Push Active', 'Browser push notifications successfully authorized.');
      }
    }
  };

  return {
    notifications,
    toasts,
    unreadCount,
    isAudioMuted,
    toggleMute,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeToast,
    requestWebPush,
  };
}
