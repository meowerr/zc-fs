import React from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, Bell } from 'lucide-react';
import { ToastItem } from '../../hooks/useNotifications';
import { NotificationType } from '../../lib/database.types';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const toastTone = (type: NotificationType) => {
  switch (type) {
    case 'review_result':
      return { Icon: CheckCircle2, color: 'text-accent-lime', bar: 'bg-accent-lime' };
    case 'task_due_soon':
      return { Icon: AlertCircle, color: 'text-accent-yellow', bar: 'bg-accent-yellow' };
    case 'announcement':
      return { Icon: Sparkles, color: 'text-accent-orange', bar: 'bg-accent-orange' };
    default:
      return { Icon: Bell, color: 'text-accent-cyan', bar: 'bg-accent-cyan' };
  }
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="fixed z-[60] inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-auto md:top-20 md:right-5 flex flex-col gap-2 md:w-96 pointer-events-none"
    >
      {toasts.map((toast) => {
        const { Icon, color, bar } = toastTone(toast.type);
        return (
          <div
            key={toast.id}
            role="status"
            className="relative overflow-hidden pointer-events-auto pl-4 pr-2 py-3 rounded-xl bg-cyber-surface-elevated border border-cyber-border-strong shadow-cyber-elevated animate-slide-up md:animate-slide-in-right flex items-start gap-3"
          >
            <span className={`absolute left-0 inset-y-0 w-1 ${bar}`} aria-hidden="true" />
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${color}`} aria-hidden="true" />

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-cyber-primary">{toast.title}</p>
              <p className="text-xs text-cyber-secondary line-clamp-2 mt-0.5 leading-snug">{toast.message}</p>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label={`Dismiss notification: ${toast.title}`}
              className="w-9 h-9 -my-1 shrink-0 rounded-lg flex items-center justify-center text-cyber-muted hover:text-cyber-primary hover:bg-cyber-surface-hover transition-colors duration-fast cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
