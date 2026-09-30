import { useState, useEffect, useCallback } from 'react';
import { NotificationItem, NotificationType, Profile } from '../lib/database.types';
import { playTelemetrySound } from '../lib/telemetryAudio';
import { isDemoMode } from '../lib/supabase';
import { INITIAL_NOTIFICATIONS } from '../lib/demoData';

export interface ToastItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

export function useNotifications(currentUser: Profile | null) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('zcfs_notifications');
    if (!isDemoMode) return [];
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => {
    return localStorage.getItem('zcfs_audio_muted') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('zcfs_notifications', JSON.stringify(notifications));
  }, [notifications]);

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

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    link: string | null = null
  ) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: currentUser?.id || 'guest',
      type,
      title,
      message,
      link,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Add toast banner
    const toastId = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id: toastId, type, title, message }]);

    // Play synthesized sound
    if (type === 'review_result' && message.toLowerCase().includes('approved')) {
      playTelemetrySound('success');
    } else if (type === 'task_due_soon') {
      playTelemetrySound('alert');
    } else {
      playTelemetrySound('chime');
    }

    // Auto-dismiss toast after 4.5s
    setTimeout(() => {
      removeToast(toastId);
    }, 4500);
  }, [currentUser, removeToast]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
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
