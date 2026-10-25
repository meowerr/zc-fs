import React, { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Bell, BookOpen, LogOut, ChevronDown } from 'lucide-react';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { UserRole } from '../../lib/database.types';

interface TopHeaderProps {
  currentRole: UserRole;
  userName: string;
  userEmail?: string;
  groupName?: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onSignOut?: () => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  onOpenGuide?: () => void;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Club admin',
  head: 'Group head',
  member: 'Engineer',
  pending: 'Pending',
};

const iconButton =
  'relative w-10 h-10 rounded-lg flex items-center justify-center text-cyber-secondary hover:text-cyber-primary hover:bg-cyber-surface-hover border border-transparent hover:border-cyber-border transition-colors duration-fast cursor-pointer';

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentRole,
  userName,
  userEmail,
  groupName = 'Vehicle Dynamics',
  isDarkMode,
  onToggleTheme,
  onSignOut,
  notificationCount = 0,
  onOpenNotifications,
  onOpenGuide,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handlePointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setIsMenuOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isMenuOpen]);

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-cyber-surface/90 border-b border-cyber-border pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-cyber-bg border border-accent-cyan/60 shrink-0"
            aria-hidden="true"
          >
            <span className="font-display font-black text-accent-cyan text-sm sm:text-base tracking-tighter">ZC</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-sm tracking-widest text-cyber-primary uppercase">
                PitLane
              </span>
              <span className="hidden sm:inline-flex px-1.5 h-5 items-center rounded text-2xs font-mono font-bold bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30">
                FS-2026
              </span>
            </div>
            <p className="text-xs text-cyber-muted truncate max-w-[45vw] sm:max-w-xs">{groupName}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button type="button" onClick={onOpenGuide} aria-label="Open role guide" title="Role guide" className={`${iconButton} hidden sm:flex`}>
            <BookOpen className="w-[18px] h-[18px]" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDarkMode ? 'Light theme' : 'Dark theme'}
            className={iconButton}
          >
            {isDarkMode ? <Sun className="w-[18px] h-[18px]" aria-hidden="true" /> : <Moon className="w-[18px] h-[18px]" aria-hidden="true" />}
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label={notificationCount > 0 ? `Notifications, ${notificationCount} unread` : 'Notifications'}
            title="Notifications"
            className={iconButton}
          >
            <Bell className="w-[18px] h-[18px]" aria-hidden="true" />
            {notificationCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-red text-on-accent font-mono text-2xs font-bold flex items-center justify-center ring-2 ring-cyber-surface"
                aria-hidden="true"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          <div className="relative ml-1" ref={menuRef}>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label={`Account menu for ${userName}`}
              className="flex items-center gap-2 h-10 pl-1 pr-1 sm:pl-2 rounded-lg hover:bg-cyber-surface-hover border border-transparent hover:border-cyber-border transition-colors duration-fast cursor-pointer"
            >
              <span className="hidden lg:block text-right">
                <span className="block text-sm font-semibold text-cyber-primary leading-tight max-w-[160px] truncate">{userName}</span>
                <span className="block text-2xs font-mono text-cyber-muted uppercase tracking-wide">{ROLE_LABEL[currentRole]}</span>
              </span>
              <ChromeAvatar name={userName} role={currentRole} size="sm" />
              <ChevronDown className={`hidden sm:block w-4 h-4 text-cyber-muted transition-transform duration-fast ${isMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {isMenuOpen && (
              <div
                role="menu"
                aria-label="Account"
                onKeyDown={handleMenuKeyDown}
                className="absolute right-0 top-full mt-2 w-64 p-1.5 rounded-xl bg-cyber-surface-elevated border border-cyber-border-strong shadow-cyber-elevated animate-pop-in origin-top-right"
              >
                <div className="px-3 py-2.5 border-b border-cyber-border mb-1">
                  <p className="text-sm font-semibold text-cyber-primary truncate">{userName}</p>
                  {userEmail && <p className="text-xs text-cyber-muted truncate">{userEmail}</p>}
                  <p className="mt-1 text-2xs font-mono uppercase tracking-wide text-accent-cyan">
                    {ROLE_LABEL[currentRole]} · {groupName}
                  </p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenGuide?.();
                  }}
                  className="w-full h-10 px-3 rounded-lg flex items-center gap-2.5 text-sm text-cyber-secondary hover:text-cyber-primary hover:bg-cyber-surface-hover focus-visible:bg-cyber-surface-hover transition-colors duration-fast cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" aria-hidden="true" /> Role guide
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSignOut?.();
                  }}
                  className="w-full h-10 px-3 rounded-lg flex items-center gap-2.5 text-sm text-accent-red hover:bg-accent-red/10 focus-visible:bg-accent-red/10 transition-colors duration-fast cursor-pointer"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
