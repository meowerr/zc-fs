import React from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GhostButton } from '../common/GhostButton';
import { NotificationItem, NotificationType } from '../../lib/database.types';

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
  onSelectNotification?: (notification: NotificationItem) => void;
}

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
  onSelectNotification,
}) => {
  if (!isOpen) return null;

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'review_result':
        return <CheckCircle2 className="w-4 h-4 text-accent-lime" />;
      case 'task_due_soon':
        return <AlertCircle className="w-4 h-4 text-accent-yellow" />;
      case 'announcement':
        return <Sparkles className="w-4 h-4 text-accent-orange" />;
      default:
        return <Clock className="w-4 h-4 text-accent-cyan" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/75 backdrop-blur-md">
      <GlassCard
        variant="elevated"
        className="w-full max-w-sm sm:max-w-md max-h-[85vh] flex flex-col p-5 border-cyber-border-strong shadow-2xl space-y-3"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyber-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-cyber-primary uppercase tracking-wider">
                Telemetry Notifications
              </h3>
              <span className="text-[10px] font-mono text-cyber-muted">
                {unreadCount} UNREAD ALERTS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Audio Mute / Unmute Button */}
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg hover:bg-cyber-surface-hover transition-colors text-cyber-secondary hover:text-cyber-primary cursor-pointer"
              title={isAudioMuted ? 'Unmute telemetry sound effects' : 'Mute sound effects'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-accent-red" /> : <Volume2 className="w-4 h-4 text-accent-cyan" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-cyber-surface-hover text-cyber-secondary hover:text-cyber-primary cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between text-xs py-1 px-1 border-b border-cyber-border flex-shrink-0">
          <button
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1 font-mono text-[11px] text-accent-cyan hover:underline disabled:opacity-30 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>

          <button
            onClick={onRequestWebPush}
            className="font-mono text-[10px] text-cyber-muted hover:text-cyber-primary hover:underline cursor-pointer"
          >
            Enable Web Push
          </button>
        </div>

        {/* Notifications Scroll Stream */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-cyber-muted italic">
              No notifications. System telemetry is nominal.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.is_read) {
                    onMarkAsRead(notif.id);
                  }
                  onSelectNotification?.(notif);
                }}
                className={`
                  p-3 rounded-xl transition-all cursor-pointer border space-y-1.5 hover:border-accent-cyan/60
                  ${
                    notif.is_read
                      ? 'bg-cyber-surface/60 border-cyber-border opacity-75'
                      : 'bg-cyber-surface-elevated border-accent-cyan/30 shadow-sm'
                  }
                `}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-cyber-primary">
                    {getTypeIcon(notif.type)}
                    <span>{notif.title}</span>
                  </div>
                  <span className="font-mono text-[9px] text-cyber-muted">
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-cyber-secondary pl-6 leading-relaxed font-sans">
                  {notif.message}
                </p>
                {onSelectNotification && (
                  <div className="pl-6 flex items-center gap-1 text-[10px] font-mono text-accent-cyan font-bold pt-0.5">
                    <span>Inspect Target</span>
                    <span className="text-xs">→</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-cyber-border flex justify-end flex-shrink-0">
          <GhostButton size="sm" onClick={onClose}>
            Close
          </GhostButton>
        </div>
      </GlassCard>
    </div>
  );
};
