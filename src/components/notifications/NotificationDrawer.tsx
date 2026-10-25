import React from 'react';
import {
  X,
  Bell,
  BellRing,
  CheckCheck,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { NotificationItem, NotificationType } from '../../lib/database.types';
import { Modal, ModalCloseButton } from '../common/Modal';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  isAudioMuted: boolean;
  onToggleMute: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRequestWebPush: () => void;
}

const typeIcon = (type: NotificationType) => {
  switch (type) {
    case 'review_result':
      return <CheckCircle2 className="w-4 h-4 text-accent-lime" aria-hidden="true" />;
    case 'task_due_soon':
      return <AlertCircle className="w-4 h-4 text-accent-yellow" aria-hidden="true" />;
    case 'announcement':
      return <Sparkles className="w-4 h-4 text-accent-orange" aria-hidden="true" />;
    default:
      return <Clock className="w-4 h-4 text-accent-cyan" aria-hidden="true" />;
  }
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  isAudioMuted,
  onToggleMute,
  onMarkAsRead,
  onMarkAllAsRead,
  onRequestWebPush,
}) => {
  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} placement="right" labelledBy="notif-title">
      <div className="w-full sm:max-w-md h-full sm:h-auto sm:max-h-[calc(100vh-2rem)] flex flex-col bg-cyber-surface-elevated border-l sm:border border-cyber-border-strong sm:rounded-xl shadow-cyber-elevated">
        <header className="flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 border-b border-cyber-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20" aria-hidden="true">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="notif-title" className="font-display font-bold text-base text-cyber-primary tracking-wide">
                Notifications
              </h3>
              <p className="text-xs text-cyber-muted">
                {unreadCount === 0 ? 'You’re all caught up' : `${unreadCount} unread`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleMute}
              aria-pressed={!isAudioMuted}
              aria-label={isAudioMuted ? 'Turn notification sounds on' : 'Turn notification sounds off'}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-cyber-surface-hover transition-colors duration-fast text-cyber-secondary hover:text-cyber-primary cursor-pointer"
            >
              {isAudioMuted ? (
                <VolumeX className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Volume2 className="w-4 h-4 text-accent-cyan" aria-hidden="true" />
              )}
            </button>
            <ModalCloseButton onClick={onClose} label="Close notifications">
              <X className="w-4 h-4" aria-hidden="true" />
            </ModalCloseButton>
          </div>
        </header>

        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-cyber-border">
          <button
            type="button"
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-accent-cyan hover:bg-accent-cyan/10 disabled:text-cyber-muted disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors duration-fast cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" aria-hidden="true" /> Mark all as read
          </button>
          <button
            type="button"
            onClick={onRequestWebPush}
            className="h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-cyber-secondary hover:text-cyber-primary hover:bg-cyber-surface-hover transition-colors duration-fast cursor-pointer"
          >
            <BellRing className="w-4 h-4" aria-hidden="true" /> Enable push alerts
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {notifications.length === 0 ? (
            <div className="py-16 px-6 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent-lime/10 border border-accent-lime/25 text-accent-lime flex items-center justify-center" aria-hidden="true">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-semibold text-sm text-cyber-primary">No notifications yet</p>
              <p className="text-sm text-cyber-secondary max-w-xs">
                Task assignments, review results and mentions will show up here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {notifications.map((notif) => (
                <li key={notif.id}>
                  <button
                    type="button"
                    onClick={() => onMarkAsRead(notif.id)}
                    aria-label={`${notif.is_read ? '' : 'Unread: '}${notif.title}. ${notif.message}`}
                    className={`
                      relative w-full text-left p-3 pl-4 rounded-lg border transition-colors duration-fast cursor-pointer
                      ${
                        notif.is_read
                          ? 'bg-transparent border-cyber-border hover:bg-cyber-surface-hover'
                          : 'bg-cyber-surface border-accent-cyan/30 hover:border-accent-cyan/60'
                      }
                    `}
                  >
                    {!notif.is_read && (
                      <span className="absolute left-1.5 top-4 w-1.5 h-1.5 rounded-full bg-accent-cyan" aria-hidden="true" />
                    )}
                    <span className="flex items-start justify-between gap-3">
                      <span className="flex items-center gap-2 min-w-0">
                        {typeIcon(notif.type)}
                        <span className={`text-sm truncate ${notif.is_read ? 'text-cyber-secondary' : 'font-semibold text-cyber-primary'}`}>
                          {notif.title}
                        </span>
                      </span>
                      <time dateTime={notif.created_at} className="font-mono text-2xs text-cyber-muted shrink-0 mt-0.5">
                        {formatTime(notif.created_at)}
                      </time>
                    </span>
                    <span className="block text-xs text-cyber-secondary mt-1 pl-6 leading-relaxed">
                      {notif.message}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};
