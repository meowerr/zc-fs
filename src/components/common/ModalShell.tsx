import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalShellProps {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  headerExtra?: React.ReactNode;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  open,
  title,
  onClose,
  children,
  footer,
  maxWidth = 'md:max-w-lg',
  headerExtra,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} max-h-[92dvh] md:max-h-[85dvh] flex flex-col rounded-t-2xl md:rounded-2xl bg-cyber-surface border border-cyber-border-strong shadow-cyber-elevated overflow-hidden animate-fade-in`}
      >
        <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-cyber-border">
          <div className="flex items-center gap-2 min-w-0">
            {typeof title === 'string' ? (
              <h2 className="font-display font-bold text-sm uppercase tracking-wider text-cyber-primary truncate">
                {title}
              </h2>
            ) : (
              title
            )}
            {headerExtra}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="tap-target rounded-lg text-cyber-muted hover:text-cyber-primary cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">{children}</div>
        {footer && (
          <div className="shrink-0 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-cyber-border bg-cyber-surface/90">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
