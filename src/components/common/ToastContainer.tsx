import React from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, Bell } from 'lucide-react';
import { ToastItem } from '../../hooks/useNotifications';
import { NotificationType } from '../../lib/database.types';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'review_result':
        return <CheckCircle2 className="w-4 h-4 text-accent-lime" />;
      case 'task_due_soon':
        return <AlertCircle className="w-4 h-4 text-accent-yellow" />;
      case 'announcement':
        return <Sparkles className="w-4 h-4 text-accent-orange" />;
      default:
        return <Bell className="w-4 h-4 text-accent-cyan" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto p-3.5 rounded-xl bg-cyber-surface-elevated border border-cyber-border-strong shadow-cyber-elevated animate-fade-in transition-all flex items-start gap-3"
        >
          <div className="p-1.5 rounded-lg bg-cyber-surface border border-cyber-border flex-shrink-0 mt-0.5">
            {getIcon(toast.type)}
          </div>

          <div className="flex-1 min-w-0">
            <h5 className="font-display font-bold text-xs text-cyber-primary uppercase tracking-wider">
              {toast.title}
            </h5>
            <p className="text-xs text-cyber-secondary line-clamp-2 mt-0.5 leading-snug font-sans">
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-cyber-muted hover:text-cyber-primary p-1 cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
