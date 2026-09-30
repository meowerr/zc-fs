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
        return <CheckCircle2 className="w-4 h-4 text-[#8ED91E]" />;
      case 'task_due_soon':
        return <AlertCircle className="w-4 h-4 text-telemetry-amber" />;
      case 'announcement':
        return <Sparkles className="w-4 h-4 text-telemetry-pink" />;
      default:
        return <Bell className="w-4 h-4 text-telemetry-blue" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto p-3.5 rounded-2xl backdrop-blur-xl bg-white/90 dark:bg-midnight-800/90 border border-telemetry-blue/50 dark:border-telemetry-aqua/40 shadow-xl shadow-telemetry-blue/10 animate-fade-in transition-all flex items-start gap-3"
        >
          <div className="p-1 rounded-lg bg-black/5 dark:bg-white/10 flex-shrink-0 mt-0.5">
            {getIcon(toast.type)}
          </div>

          <div className="flex-1 min-w-0">
            <h5 className="font-display font-bold text-xs text-chrome-900 dark:text-white uppercase tracking-wider">
              {toast.title}
            </h5>
            <p className="text-xs text-chrome-900/80 dark:text-white/80 line-clamp-2 mt-0.5 leading-snug">
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-chrome-900/40 dark:text-white/40 hover:text-chrome-900 dark:hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
