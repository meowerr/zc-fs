import React from 'react';
import { Sun, Moon, Radio, Bell, BookOpen, Palette, Search } from 'lucide-react';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { UserRole } from '../../lib/database.types';

interface TopHeaderProps {
  currentRole: UserRole;
  userName: string;
  groupName?: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenProfile?: () => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  onOpenGuide?: () => void;
  onOpenStyleGuide?: () => void;
  onOpenSearch?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentRole,
  userName,
  groupName = 'Vehicle Dynamics',
  isDarkMode,
  onToggleTheme,
  onOpenProfile,
  notificationCount = 0,
  onOpenNotifications,
  onOpenGuide,
  onOpenStyleGuide,
  onOpenSearch,
}) => {
  return (
    <header 
      className="sticky top-0 z-20 w-full backdrop-blur-md bg-cyber-surface/90 border-b border-cyber-border transition-all duration-200"
      style={{ paddingLeft: 'var(--rail-offset, 0px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Left Section: Mobile Brand or Desktop Sub-Team Telemetry Breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Mobile-Only Brand Logo */}
          <div className="md:hidden flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyber-bg border border-accent-cyan/60 shadow-[0_0_10px_rgba(0,217,255,0.2)]">
              <span className="font-display font-black text-accent-cyan text-xs tracking-tighter">ZC</span>
              <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-accent-cyan animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display font-black text-xs tracking-widest text-cyber-primary uppercase">
                  PitLane
                </h1>
                <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30">
                  FS-2026
                </span>
              </div>
              <p className="text-[10px] font-mono text-cyber-muted tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
                <span className="truncate max-w-[120px]">{groupName}</span>
              </p>
            </div>
          </div>

          {/* Desktop Sub-Team Context Indicator */}
          <div className="hidden md:flex items-center gap-2.5 py-1 px-2.5 rounded-lg bg-cyber-surface-elevated/60 border border-cyber-border/70">
            <span className="font-mono text-accent-cyan text-xs font-bold">//</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
              <span className="font-mono text-xs font-semibold tracking-wider text-cyber-primary uppercase">
                {groupName}
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Live Indicator & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyber-bg-alt border border-cyber-border font-mono text-xs">
            <Radio className="w-3.5 h-3.5 text-accent-lime animate-pulse" />
            <span className="text-cyber-secondary">ONLINE</span>
            <span className="text-accent-cyan ml-1 text-[11px]">@zewailcity.edu.eg</span>
          </div>

          {/* Design System Style Guide Shortcut */}
          {onOpenStyleGuide && (
            <button
              onClick={onOpenStyleGuide}
              aria-label="Design System Style Guide"
              title="Open Cyber Racing Style Guide (/styleguide)"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-cyber-surface-elevated border border-cyber-border text-cyber-secondary hover:text-accent-cyan hover:border-accent-cyan/50 transition-all active:scale-95 shadow-cyber-sm cursor-pointer"
            >
              <Palette className="w-4 h-4 text-accent-cyan" />
            </button>
          )}

          {/* Protocol Operations Guide */}
          <button
            onClick={onOpenGuide}
            aria-label="Engineering Protocol Guide"
            title="Formula Student Role Operations Guide"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-cyber-surface-elevated border border-cyber-border text-cyber-secondary hover:text-cyber-primary hover:border-cyber-border-strong transition-all active:scale-95 shadow-cyber-sm cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Global Telemetry Search (Ctrl+K) */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              aria-label="Search Workspace"
              title="Search Deliverables, Engineers, Comms (Ctrl+K)"
              className="flex items-center gap-2 h-9 sm:h-10 px-2.5 sm:px-3 rounded-lg bg-cyber-surface-elevated border border-cyber-border text-cyber-secondary hover:text-accent-cyan hover:border-accent-cyan/50 transition-all active:scale-95 shadow-cyber-sm cursor-pointer"
            >
              <Search className="w-4 h-4 text-accent-cyan" />
              <span className="hidden xl:inline text-xs font-mono text-cyber-muted">Search...</span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded bg-cyber-bg border border-cyber-border font-mono text-[9px] text-cyber-muted">
                ⌘K
              </kbd>
            </button>
          )}

          {/* In-App Notification Bell */}
          <button
            onClick={onOpenNotifications}
            aria-label="Open notifications"
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-cyber-surface-elevated border border-cyber-border text-cyber-secondary hover:text-cyber-primary hover:border-cyber-border-strong transition-all active:scale-95 shadow-cyber-sm cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded bg-accent-red text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-sm animate-pulse">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-cyber-surface-elevated border border-cyber-border text-cyber-secondary hover:text-accent-yellow hover:border-accent-yellow/50 transition-all active:scale-95 shadow-cyber-sm cursor-pointer"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-accent-yellow" />
            ) : (
              <Moon className="w-4 h-4 text-accent-cyan" />
            )}
          </button>

          {/* User Avatar & Role */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-cyber-surface-hover transition-all text-left cursor-pointer border border-transparent hover:border-cyber-border"
          >
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-cyber-primary leading-tight">
                {userName}
              </div>
              <div className="text-[10px] font-mono text-accent-cyan uppercase tracking-wider">
                {currentRole}
              </div>
            </div>
            <ChromeAvatar name={userName} role={currentRole} size="sm" />
          </button>
        </div>
      </div>
    </header>
  );
};
