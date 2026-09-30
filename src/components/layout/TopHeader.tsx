import React from 'react';
import { Sun, Moon, Radio, Sparkles, Bell } from 'lucide-react';
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
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-midnight-900/80 border-b border-chrome-300/80 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand / Club Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-telemetry-blue to-telemetry-aqua shadow-neon-blue/20">
            <span className="font-display font-black text-white text-base tracking-tighter">ZC</span>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-sm tracking-widest text-chrome-900 dark:text-white uppercase">
                PitLane
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-telemetry-blue/15 text-telemetry-blue border border-telemetry-blue/30">
                FS-2026
              </span>
            </div>
            <p className="text-[11px] font-mono text-chrome-900/60 dark:text-white/50 tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8ED91E] shadow-neon-lime animate-ping" />
              <span className="truncate max-w-[150px] sm:max-w-none">{groupName}</span>
            </p>
          </div>
        </div>

        {/* Telemetry Live Indicator & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 font-mono text-xs">
            <Radio className="w-3.5 h-3.5 text-[#8ED91E] animate-pulse" />
            <span className="text-chrome-900/80 dark:text-white/80">ONLINE</span>
            <span className="text-telemetry-aqua ml-1">@zewailcity.edu.eg</span>
          </div>

          {/* In-App Notification Bell */}
          <button
            onClick={onOpenNotifications}
            aria-label="Open notifications"
            className="relative w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-midnight-800/80 border border-chrome-300 dark:border-white/10 text-chrome-900 dark:text-white hover:border-telemetry-blue transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-telemetry-pink text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-sm animate-pulse">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-midnight-800/80 border border-chrome-300 dark:border-white/10 text-chrome-900 dark:text-white hover:border-telemetry-blue transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-telemetry-amber" />
            ) : (
              <Moon className="w-4 h-4 text-telemetry-blue" />
            )}
          </button>

          {/* User Avatar & Role */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-white/40 dark:hover:bg-white/5 transition-all text-left cursor-pointer"
          >
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-chrome-900 dark:text-white leading-tight">
                {userName}
              </div>
              <div className="text-[10px] font-mono text-telemetry-blue dark:text-telemetry-aqua uppercase tracking-wider">
                {currentRole}
              </div>
            </div>
            <ChromeAvatar name={userName} role={currentRole} size="md" />
          </button>
        </div>
      </div>
    </header>
  );
};
