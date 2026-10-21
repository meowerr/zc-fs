import React from 'react';
import { Sun, Moon, Bell, BookOpen, Palette, Search } from 'lucide-react';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { ZfsMonogram } from '../brand/ZfsMonogram';
import { UserRole } from '../../lib/database.types';
import { NavTab } from '../../config/navigation';

interface TopHeaderProps {
  currentRole: UserRole;
  userName: string;
  userEmail?: string;
  groupName?: string;
  activeTab?: NavTab;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenProfile?: () => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  onOpenGuide?: () => void;
  onOpenStyleGuide?: () => void;
  onOpenSearch?: () => void;
}

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Mission Control',
  tasks: 'Deliverables',
  chat: 'Pit Wall Comms',
  docs: 'Documents',
  team: 'Team Directory',
  admin: 'Admin Hub',
  profile: 'Profile',
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentRole,
  userName,
  userEmail,
  groupName = 'Vehicle Dynamics',
  activeTab = 'dashboard',
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
      className="sticky top-0 z-20 w-full backdrop-blur-md bg-cyber-surface/90 border-b border-cyber-border transition-all duration-200 overflow-x-clip pt-[env(safe-area-inset-top)]"
      style={{ paddingLeft: 'var(--rail-offset, 0px)' }}
    >
      <div className="max-w-7xl mx-auto safe-header-pad sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Section: Mobile Brand or Contextual Page Title or Desktop Sub-Team Telemetry Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 md:flex-initial">
          {/* Mobile Left Section */}
          <div className="md:hidden flex items-center gap-2 min-w-0 flex-1">
            {!activeTab || activeTab === 'dashboard' ? (
              <>
                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyber-bg border border-cyber-border p-1 shrink-0">
                  <ZfsMonogram glow={false} className="w-full h-auto" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-display font-black text-xs tracking-wider text-cyber-primary uppercase leading-tight truncate">
                      PitLane
                    </h1>
                    <span className="hidden xs:inline-block px-1 py-0.5 rounded text-label font-mono font-medium bg-brand-orange/15 text-brand-light-orange border border-brand-orange/30">
                      ZFS-2026
                    </span>
                  </div>
                  <p className="text-label font-mono text-cyber-secondary tracking-wider flex items-center gap-1 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse shrink-0" />
                    <span className="truncate min-w-0 flex-1">{groupName}</span>
                  </p>
                </div>
              </>
            ) : (
              <div className="min-w-0 flex-1">
                <h1 className="font-display font-black text-xs sm:text-sm tracking-wider text-cyber-primary uppercase leading-tight truncate">
                  {TAB_TITLES[activeTab] || 'PitLane'}
                </h1>
                <p className="text-label font-sans text-cyber-secondary tracking-wider flex items-center gap-1 min-w-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0" />
                  <span className="truncate min-w-0 flex-1">{groupName}</span>
                </p>
              </div>
            )}
          </div>

          {/* Desktop Sub-Team Context Indicator */}
          <div className="hidden md:flex items-center gap-2 py-1 px-2.5 rounded-lg bg-cyber-surface-elevated/60 border border-cyber-border/70">
            <span className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
            <span className="font-mono text-xs tracking-wider text-cyber-primary uppercase">
              {groupName}
            </span>
          </div>
        </div>

        {/* Telemetry Live Indicator & Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* User Email Context Pill (replaces duplicate static online indicator) */}
          {userEmail && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyber-bg-alt border border-cyber-border font-mono text-label text-cyber-secondary truncate max-w-[220px]" title={userEmail}>
              <span className="text-accent-cyan font-bold truncate">{userEmail}</span>
            </div>
          )}

          {/* Design System Style Guide Shortcut (Desktop Only) */}
          {onOpenStyleGuide && (
            <button
              onClick={onOpenStyleGuide}
              aria-label="Design System Style Guide"
              title="Open Cyber Racing Style Guide (/styleguide)"
              className="hidden md:flex tap-target sm:w-10 sm:h-10 rounded-lg items-center justify-center bg-cyber-surface-elevated border border-cyber-border text-cyber-secondary hover:text-accent-cyan hover:border-accent-cyan/50 transition-all active:scale-95 shadow-cyber-sm cursor-pointer shrink-0"
            >
              <Palette className="w-4 h-4 text-accent-cyan" />
            </button>
          )}

          {/* Protocol Operations Guide (Tablet & Desktop Only) */}
          <button
            onClick={onOpenGuide}
            aria-label="Engineering Protocol Guide"
            title="Formula Student Role Operations Guide"
            className="hidden sm:flex tap-target sm:w-10 sm:h-10 rounded-lg items-center justify-center bg-cyber-surface-elevated border border-cyber-border text-cyber-secondary hover:text-cyber-primary hover:border-cyber-border-strong transition-all active:scale-95 shadow-cyber-sm cursor-pointer shrink-0"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Global Telemetry Search (Ctrl+K) */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              aria-label="Search Workspace"
              title="Search Deliverables, Engineers, Comms (Ctrl+K)"
              className="tap-target sm:w-auto sm:h-10 sm:px-3 rounded-lg bg-cyber-surface-elevated border border-cyber-border text-cyber-secondary hover:text-accent-cyan hover:border-accent-cyan/50 transition-all active:scale-95 shadow-cyber-sm cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4 text-accent-cyan" />
              <span className="hidden xl:inline text-xs font-mono text-cyber-muted ml-2">Search...</span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded bg-cyber-bg border border-cyber-border font-mono text-label text-cyber-secondary ml-2">
                ⌘K
              </kbd>
            </button>
          )}

          {/* In-App Notification Bell */}
          <button
            onClick={onOpenNotifications}
            aria-label="Open notifications"
            className="relative tap-target sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-cyber-surface-elevated border border-cyber-border text-cyber-secondary hover:text-cyber-primary hover:border-cyber-border-strong transition-all active:scale-95 shadow-cyber-sm cursor-pointer shrink-0"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded bg-accent-red text-white font-mono text-label font-medium flex items-center justify-center shadow-sm animate-pulse">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="hidden md:flex tap-target sm:w-10 sm:h-10 rounded-lg items-center justify-center bg-cyber-surface-elevated border border-cyber-border text-cyber-secondary hover:text-accent-yellow hover:border-accent-yellow/50 transition-all active:scale-95 shadow-cyber-sm cursor-pointer shrink-0"
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
            aria-label="User Profile"
            className="tap-target sm:w-auto sm:min-w-0 flex items-center gap-1.5 sm:gap-2 p-0.5 sm:p-1 rounded-lg hover:bg-cyber-surface-hover transition-all text-left cursor-pointer border border-transparent hover:border-cyber-border shrink-0"
          >
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-cyber-primary leading-tight truncate max-w-[120px]">
                {userName}
              </div>
              <div className="text-label font-mono text-accent-cyan uppercase tracking-wider font-medium">
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
