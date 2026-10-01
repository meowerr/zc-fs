import React from 'react';
import { Palette } from 'lucide-react';
import { UserRole, Group, Task } from '../../lib/database.types';
import { NavTab, getVisibleNavItems } from '../../config/navigation';
import { SUB_TEAMS } from '../../lib/constants';

export interface HybridRacingRailProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  role: UserRole;
  currentGroupName?: string;
  onSelectGroup?: (groupSlug: string) => void;
  unreadCount?: number;
  groups?: Group[];
  tasks?: Task[];
  onOpenStyleGuide?: () => void;
}

export const HybridRacingRail: React.FC<HybridRacingRailProps> = ({
  activeTab,
  onTabChange,
  role,
  currentGroupName = 'Technical - Vehicle Dynamics',
  onSelectGroup,
  unreadCount = 0,
  groups = [],
  tasks = [],
  onOpenStyleGuide,
}) => {
  const visibleItems = getVisibleNavItems(role);
  const sourceGroups = groups.length > 0 ? groups : SUB_TEAMS;

  return (
    <aside
      aria-label="PitLane Control Console"
      className="hidden md:flex flex-col fixed top-[var(--rail-gap,12px)] bottom-[var(--rail-gap,12px)] left-[var(--rail-gap,12px)] w-[var(--rail-w,72px)] z-30 bg-cyber-surface/95 dark:bg-midnight-900/95 backdrop-blur-md border border-cyber-border rounded-xl shadow-cyber-elevated transition-all duration-200 select-none"
    >
      {/* ─── TOP SECTION: MOTORSPORT LOGO & BRAND ─── */}
      <div className="pt-3 pb-2.5 flex flex-col items-center justify-center shrink-0 border-b border-cyber-border/80">
        <button
          onClick={() => onTabChange('dashboard')}
          title="Mission Control - PitLane OS"
          aria-label="Return to Mission Control"
          className="group relative flex flex-col items-center justify-center p-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-cyan cursor-pointer"
        >
          {/* Hex / Chamfered ZC Badge */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyber-bg border border-accent-cyan/60 group-hover:border-accent-cyan shadow-[0_0_12px_rgba(0,217,255,0.25)] transition-all group-active:scale-95">
            <span className="font-display font-black text-accent-cyan text-sm tracking-tighter">ZC</span>
            {/* Blinking Live System Telemetry Beacon */}
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
          </div>
          <span className="font-display font-bold text-[9px] tracking-widest text-cyber-muted group-hover:text-accent-cyan uppercase mt-1 transition-colors">
            PITLANE
          </span>
        </button>
      </div>

      {/* ─── 2PX TRACK LANE LINE ─── */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent shrink-0" />

      {/* ─── MIDDLE SECTION: NAVIGATION NODES ─── */}
      <nav 
        aria-label="Primary Navigation"
        className="flex-1 py-3 px-2 flex flex-col items-center gap-1.5 overflow-hidden"
      >
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const showBadge = item.badgeKey === 'chat' && unreadCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              title={`${item.label} // ${item.subtitle}`}
              className={`
                relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-150 cursor-pointer
                focus:outline-none focus:ring-1 focus:ring-accent-cyan group
                ${
                  isActive
                    ? 'bg-cyber-surface-elevated text-accent-cyan border border-accent-cyan/50 shadow-cyber-sm'
                    : 'text-cyber-muted hover:text-cyber-primary hover:bg-cyber-surface-hover border border-transparent'
                }
              `}
            >
              {/* Active Lane Marker Line */}
              {isActive && (
                <div className="absolute left-0 inset-y-2 w-[3px] bg-accent-cyan rounded-r-full shadow-[0_0_8px_rgba(0,217,255,0.8)]" />
              )}

              {/* Icon Container */}
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'scale-105' : ''}`} />

                {/* Notification Unread Badge */}
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono font-bold bg-accent-red text-white flex items-center justify-center shadow-sm animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* ─── SUB-TEAMS TELEMETRY PIPS ─── */}
      <div 
        className="py-2.5 px-2 flex flex-col items-center gap-1.5 border-t border-cyber-border/60"
        title="5 Formula Student Sub-Teams Telemetry Status"
      >
        <div className="flex items-center gap-1">
          {sourceGroups.slice(0, 5).map((team) => {
            const isUserTeam = currentGroupName.includes(team.name.replace(/^Technical - |^Operations - /, '')) || currentGroupName === team.name;
            const isHighlighted = role === 'admin' || isUserTeam;
            const teamTasks = tasks.filter((t) => t.group_id === team.id);

            return (
              <button
                key={team.id || team.slug}
                onClick={() => onSelectGroup?.(team.slug)}
                title={`${team.name} (${teamTasks.length} tasks)`}
                aria-label={team.name}
                className={`
                  w-1.5 h-3.5 rounded-full transition-all duration-150 cursor-pointer
                  hover:scale-125 focus:outline-none
                  ${isHighlighted ? 'opacity-100 shadow-[0_0_6px_currentColor]' : 'opacity-25 hover:opacity-75'}
                `}
                style={{ backgroundColor: team.color_accent || '#00D9FF' }}
              />
            );
          })}
        </div>
        <span className="text-[8px] font-mono text-cyber-muted tracking-tighter uppercase">
          5 TEAMS
        </span>
      </div>

      {/* ─── BOTTOM SECTION: TELEMETRY LED & PROTOCOL CONTROLS ─── */}
      <div className="p-2 shrink-0 flex flex-col items-center gap-2 border-t border-cyber-border/80">
        {/* Style Guide quick launch (if wired) */}
        {onOpenStyleGuide && (
          <button
            onClick={onOpenStyleGuide}
            title="Cyber Racing Style Guide (/styleguide)"
            aria-label="Open Design System Style Guide"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-cyber-muted hover:text-accent-cyan hover:bg-cyber-surface-hover transition-colors cursor-pointer"
          >
            <Palette className="w-4 h-4" />
          </button>
        )}

        {/* Realtime Live Telemetry LED */}
        <div 
          title="Telemetry Link: ONLINE (@zewailcity.edu.eg)"
          className="flex flex-col items-center justify-center py-0.5 cursor-default"
        >
          <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-accent-lime/10 border border-accent-lime/30">
            <span className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
          </div>
          <span className="text-[8px] font-mono text-accent-lime font-bold tracking-tighter mt-0.5">
            LIVE
          </span>
        </div>
      </div>
    </aside>
  );
};
