import { useState, useEffect, useCallback } from 'react';
import { NotificationItem, NotificationType, Profile } from '../lib/database.types';
import { playTelemetrySound } from '../lib/telemetryAudio';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    user_id: 'any',
    type: 'announcement',
    title: 'Design Freeze Approaching',
    message: 'Official design freeze for Formula Student UK is in 45 days. Review your sub-team tasks.',
    link: null,
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    user_id: 'any',
    type: 'task_assigned',
    title: 'New Deliverable Assigned',
    message: 'You have been assigned to Double Wishbone Suspension Kinematics Simulation.',
    link: null,
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    user_id: 'any',
    type: 'review_result',
    title: 'Submission Approved',
    message: 'Your FEA Brake Caliper Bracket submission was reviewed and marked APPROVED by Kareem Tarek.',
    link: null,
    is_read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  }
];

export interface ToastItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

export function useNotifications(currentUser: Profile | null) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('zcfs_notifications');
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
