import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Shared across instances so only the top-most dialog reacts to Escape/Tab
const openStack: string[] = [];
let scrollLocks = 0;

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  isOpen?: boolean;
  labelledBy?: string;
  label?: string;
  placement?: 'center' | 'right';
  role?: 'dialog' | 'alertdialog';
  closeOnBackdrop?: boolean;
  panelClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  onClose,
  children,
  isOpen = true,
  labelledBy,
  label,
  placement = 'center',
  role = 'dialog',
  closeOnBackdrop = true,
  panelClassName = '',
}) => {
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    openStack.push(id);
    scrollLocks += 1;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const initial =
      panel?.querySelector<HTMLElement>('[autofocus], [data-autofocus]') ??
      panel?.querySelector<HTMLElement>(FOCUSABLE) ??
      panel;
    initial?.focus({ preventScroll: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (openStack[openStack.length - 1] !== id || !panelRef.current) return;

      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab') {
        const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null
        );
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const index = openStack.lastIndexOf(id);
      if (index !== -1) openStack.splice(index, 1);
      scrollLocks = Math.max(0, scrollLocks - 1);
      if (scrollLocks === 0) document.body.style.overflow = '';
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [isOpen, id]);

  if (!isOpen) return null;

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) onClose();
  };

  const layout =
    placement === 'right'
      ? 'items-stretch justify-end p-0 sm:p-4'
      : 'items-start justify-center p-0 pt-6 sm:p-4';

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex overflow-y-auto bg-black/70 backdrop-blur-sm animate-fade-in ${layout}`}
      onMouseDown={handleBackdrop}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        tabIndex={-1}
        onMouseDown={handleBackdrop}
        className={`
          w-full flex outline-none
          ${placement === 'right' ? 'justify-end animate-slide-in-right' : 'justify-center mt-auto sm:mb-auto animate-slide-up sm:animate-pop-in'}
          ${panelClassName}
        `}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

interface ModalCloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export const ModalCloseButton: React.FC<ModalCloseButtonProps> = ({
  label = 'Close dialog',
  className = '',
  children,
  ...props
}) => (
  <button
    type="button"
    aria-label={label}
    className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-cyber-muted hover:text-cyber-primary hover:bg-cyber-surface-hover transition-colors duration-fast cursor-pointer ${className}`}
    {...props}
  >
    {children}
  </button>
);
