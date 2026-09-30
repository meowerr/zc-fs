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
}) => {
  if (!isOpen) return null;

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'review_result':
        return <CheckCircle2 className="w-4 h-4 text-[#8ED91E]" />;
      case 'task_due_soon':
        return <AlertCircle className="w-4 h-4 text-telemetry-amber" />;
      case 'announcement':
        return <Sparkles className="w-4 h-4 text-telemetry-pink" />;
      default:
        return <Clock className="w-4 h-4 text-telemetry-blue" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/50 backdrop-blur-sm">
      <GlassCard
        variant="elevated"
        className="w-full max-w-sm sm:max-w-md max-h-[85vh] flex flex-col p-5 border-telemetry-blue/40 shadow-2xl space-y-3"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-chrome-300/60 dark:border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-telemetry-blue/15 text-telemetry-blue">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-chrome-900 dark:text-white uppercase tracking-wider">
                Telemetry Notifications
              </h3>
              <span className="text-[10px] font-mono text-chrome-900/50 dark:text-white/40">
                {unreadCount} UNREAD ALERTS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Audio Mute / Unmute Button */}
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-chrome-900/60 dark:text-white/60 cursor-pointer"
              title={isAudioMuted ? 'Unmute telemetry sound effects' : 'Mute sound effects'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-telemetry-red" /> : <Volume2 className="w-4 h-4 text-telemetry-aqua" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-chrome-900/60 dark:text-white/60 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between text-xs py-1 px-1 border-b border-chrome-300/40 dark:border-white/5 flex-shrink-0">
          <button
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1 font-mono text-[11px] text-telemetry-blue dark:text-telemetry-aqua hover:underline disabled:opacity-40 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>

          <button
            onClick={onRequestWebPush}
            className="font-mono text-[10px] text-chrome-900/60 dark:text-white/50 hover:underline cursor-pointer"
          >
            Enable Web Push
          </button>
        </div>

        {/* Notifications Scroll Stream */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-chrome-900/50 dark:text-white/40 italic">
              No notifications. System is nominal.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onMarkAsRead(notif.id)}
                className={`
                  p-3 rounded-xl transition-all cursor-pointer border space-y-1
                  ${
                    notif.is_read
                      ? 'bg-white/30 dark:bg-white/5 border-chrome-300/40 dark:border-white/5 opacity-75'
                      : 'bg-white/80 dark:bg-midnight-800/80 border-telemetry-blue/40 shadow-sm'
                  }
                `}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-chrome-900 dark:text-white">
                    {getTypeIcon(notif.type)}
                    <span>{notif.title}</span>
                  </div>
                  <span className="font-mono text-[9px] text-chrome-900/50 dark:text-white/40">
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-chrome-900/75 dark:text-white/70 pl-6 leading-relaxed">
                  {notif.message}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-chrome-300/40 dark:border-white/10 flex justify-end flex-shrink-0">
          <GhostButton size="sm" onClick={onClose}>
            Close
          </GhostButton>
        </div>
      </GlassCard>
    </div>
  );
};
