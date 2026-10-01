import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Palette, Pin, PinOff, Radio, Flag } from 'lucide-react';
import { UserRole, Group, Task } from '../../lib/database.types';
import { NavTab, getVisibleNavItems, getNavGroupsForRole, getNavItemsByGroup } from '../../config/navigation';
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
  const activeGroups = getNavGroupsForRole(role);
  const sourceGroups = groups.length > 0 ? groups : SUB_TEAMS;

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zcfs_rail_pinned') === 'true';
    } catch {
      return false;
    }
  });
  const [isWideScreen, setIsWideScreen] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 1280;
  });
  const [isTablet, setIsTablet] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
  });

  // Realtime Connection Status (online / reconnecting / offline)
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'reconnecting' | 'offline'>(() => {
    return typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online';
  });

  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const railRef = useRef<HTMLElement | null>(null);

  // Monitor online / offline network state
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor viewport dimensions
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsWideScreen(width >= 1280);
      setIsTablet(width >= 768 && width < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync pinned attribute to documentElement for zero-reflow layout offset
  useEffect(() => {
    const shouldPin = isPinned && isWideScreen;
    if (shouldPin) {
      document.documentElement.dataset.railPinned = 'true';
    } else {
      delete document.documentElement.dataset.railPinned;
    }
  }, [isPinned, isWideScreen]);

  // Hover Intent Logic (Desktop only - Tablet uses tap to expand)
  const handleMouseEnter = () => {
    if (isTablet) return; // Tablet uses tap only (no hover)
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    if (!enterTimeoutRef.current && !isExpanded) {
      enterTimeoutRef.current = setTimeout(() => {
        setIsExpanded(true);
        enterTimeoutRef.current = null;
      }, 120);
    }
  };

  const handleMouseLeave = () => {
    if (isTablet) return;
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
      enterTimeoutRef.current = null;
    }
    if (!isPinned) {
      leaveTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
        leaveTimeoutRef.current = null;
      }, 250);
    }
  };

  // Keyboard accessibility: expand on focus inside, collapse on focus exit
  const handleFocus = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsExpanded(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!railRef.current?.contains(e.relatedTarget as Node) && !isPinned) {
      setIsExpanded(false);
    }
  };

  // Escape key collapses overlay immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded && !isPinned) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, isPinned]);

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zcfs_rail_pinned', String(next));
      } catch {
        // storage disabled or private mode
      }
      return next;
    });
  };

  // Handle Logo / Handle Tap
  const handleLogoTap = () => {
    if (isTablet || !isPinned) {
      setIsExpanded((prev) => !prev);
    }
  };

  // Tab navigation handler (immediately navigates on tablet without double tap)
  const handleItemClick = (tabId: NavTab) => {
    onTabChange(tabId);
    if (isTablet || !isPinned) {
      setIsExpanded(false);
    }
  };

  // Current user's team color
  const userTeamColor = useMemo(() => {
    const matched = sourceGroups.find(
      (g) => currentGroupName.includes(g.name.replace(/^Technical - |^Operations - /, '')) || currentGroupName === g.name
    );
    return matched?.color_accent || '#00D9FF';
  }, [sourceGroups, currentGroupName]);

  const isOpen = isExpanded || (isPinned && isWideScreen);

  return (
    <>
      {/* Tablet Dismiss Backdrop (When expanded on tablet viewports) */}
      {isOpen && isTablet && (
        <div 
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        ref={railRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocusCapture={handleFocus}
        onBlurCapture={handleBlur}
        aria-label="PitLane Control Console"
        aria-expanded={isOpen}
        style={{ zIndex: isOpen ? 35 : 30 }}
        className={`
          hidden md:flex flex-col fixed top-[var(--rail-gap,12px)] bottom-[var(--rail-gap,12px)] left-[var(--rail-gap,12px)]
          ${isOpen ? 'w-72 shadow-cyber-elevated' : 'w-[var(--rail-w,72px)] shadow-cyber'}
          bg-cyber-surface/95 dark:bg-midnight-900/95 backdrop-blur-md border border-cyber-border rounded-xl
          transition-all duration-200 ease-out select-none overflow-hidden
        `}
      >
        {/* ─── TOP SECTION: MOTORSPORT LOGO & COMMAND HEADER ─── */}
        <div className="h-14 px-3 flex items-center justify-between shrink-0 border-b border-cyber-border/80">
          <button
            onClick={handleLogoTap}
            title={isTablet ? 'Tap to toggle PitLane command center' : 'Mission Control - PitLane OS'}
            aria-label={isTablet ? 'Toggle command center' : 'Return to Mission Control'}
            className="group flex items-center gap-2.5 focus:outline-none focus:ring-1 focus:ring-accent-cyan cursor-pointer rounded-lg p-1"
          >
            {/* Hex / Chamfered ZC Badge */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyber-bg border border-accent-cyan/60 group-hover:border-accent-cyan shadow-[0_0_10px_rgba(0,217,255,0.25)] transition-all group-active:scale-95 shrink-0">
              <span className="font-display font-black text-accent-cyan text-xs tracking-tighter">ZC</span>
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
            </div>

            {isOpen && (
              <div className="flex flex-col text-left transition-opacity duration-150 animate-fadeIn">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-xs tracking-wider text-cyber-primary uppercase">
                    PitLane
                  </span>
                  <span className="text-[9px] font-mono text-accent-cyan font-bold tracking-tight">
                    // NAV
                  </span>
                </div>
                <span className="text-[9px] font-mono text-cyber-muted tracking-widest uppercase">
                  CONTROL CONSOLE
                </span>
              </div>
            )}
          </button>

          {/* Pin Dock Toggle (Desktop >=1280px only) */}
          {isOpen && isWideScreen && (
            <button
              onClick={togglePin}
              title={isPinned ? 'Unpin Navigation Rail (Floating Mode)' : 'Pin Navigation Rail (Docked Mode)'}
              aria-label={isPinned ? 'Unpin Navigation Rail' : 'Pin Navigation Rail'}
              aria-pressed={isPinned}
              className={`
                p-1.5 rounded-lg border transition-colors cursor-pointer
                ${isPinned 
                  ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40 shadow-cyber-sm' 
                  : 'text-cyber-muted hover:text-cyber-primary border-transparent hover:border-cyber-border'
                }
              `}
            >
              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* ─── 2PX TRACK LANE LINE ─── */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent shrink-0" />

        {/* ─── NAVIGATION CONTENT AREA ─── */}
        <div className="flex-1 py-2 flex flex-col justify-between overflow-hidden">
          {isOpen ? (
            /* ─── EXPANDED COMMAND CENTER (GROUPED SECTIONS) ─── */
            <nav aria-label="Command Center Navigation" className="space-y-2.5 px-2 overflow-hidden">
              {activeGroups.map((groupId) => {
                const groupItems = getNavItemsByGroup(groupId, role);
                if (groupItems.length === 0) return null;

                return (
                  <div key={groupId} className="space-y-1">
                    {/* Group Label */}
                    <div className="px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-accent-cyan/80 flex items-center gap-1">
                      <span>//</span>
                      <span>{groupId}</span>
                    </div>

                    {/* Group Items */}
                    {groupItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const showBadge = item.badgeKey === 'chat' && unreadCount > 0;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          aria-label={item.label}
                          aria-current={isActive ? 'page' : undefined}
                          className={`
                            relative w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 cursor-pointer
                            focus:outline-none focus:ring-1 focus:ring-accent-cyan group
                            ${
                              isActive
                                ? 'bg-cyber-surface-elevated text-cyber-primary border-l-2 border-l-accent-cyan border-y border-r border-cyber-border shadow-cyber-sm'
                                : 'text-cyber-secondary hover:text-cyber-primary hover:bg-cyber-surface-hover border border-transparent'
                            }
                          `}
                        >
                          {/* Lit Active Node for Expanded View */}
                          {isActive && (
                            <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-accent-cyan shadow-[0_0_8px_rgba(0,217,255,0.9)] animate-pulse" />
                          )}

                          <div className={`p-1.5 rounded shrink-0 ${isActive ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-cyber-muted'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center justify-between">
                              <span className={`font-display text-xs tracking-wider truncate ${isActive ? 'font-bold text-accent-cyan' : 'font-medium'}`}>
                                {item.label}
                              </span>
                              {showBadge && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-accent-red text-white shadow-sm">
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-cyber-muted truncate rail-subtitles">
                              {item.subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          ) : (
            /* ─── COLLAPSED FLOATING RAIL (ICONS + LIT NODES + INSTANT CYBER TOOLTIPS) ─── */
            <nav aria-label="Primary Navigation" className="px-2 flex flex-col items-center gap-1.5 overflow-hidden">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const showBadge = item.badgeKey === 'chat' && unreadCount > 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`
                      relative flex items-center justify-center w-12 h-11 rounded-lg transition-all duration-150 cursor-pointer
                      focus:outline-none focus:ring-1 focus:ring-accent-cyan group
                      ${
                        isActive
                          ? 'bg-cyber-surface-elevated text-accent-cyan border border-accent-cyan/50 shadow-cyber-sm'
                          : 'text-cyber-muted hover:text-cyber-primary hover:bg-cyber-surface-hover border border-transparent'
                      }
                    `}
                  >
                    {/* Lit Active Node Lane Indicator */}
                    {isActive && (
                      <>
                        <div className="absolute left-0 inset-y-1.5 w-[3px] bg-accent-cyan rounded-r-full shadow-[0_0_10px_rgba(0,217,255,0.9)]" />
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-cyan shadow-[0_0_6px_rgba(0,217,255,0.9)] animate-pulse" />
                      </>
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

                    {/* Instant Cyber Tooltip (Visible in Collapsed Mode on hover) */}
                    <div 
                      role="tooltip"
                      className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-cyber-surface-elevated/95 dark:bg-midnight-950/95 border border-cyber-border-strong shadow-cyber-elevated pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap hidden md:block"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-display text-xs font-bold text-cyber-primary">
                          {item.label}
                        </span>
                        <span className="font-mono text-[9px] text-accent-cyan uppercase px-1 py-0.2 rounded bg-cyber-bg border border-accent-cyan/30">
                          {item.group}
                        </span>
                      </div>
                      <div className="font-mono text-[9px] text-cyber-muted text-left">
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          )}

          {/* ─── BOTTOM AREA: TELEMETRY & SUB-TEAM MONITOR (RLS RESPECTED) ─── */}
          <div className="pt-2 border-t border-cyber-border/80 px-2 space-y-2 shrink-0">
            {isOpen ? (
              /* Expanded Telemetry & Sub-team Overview */
              <div className="space-y-2">
                <div className="px-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-cyber-muted">
                  <span className="flex items-center gap-1.5">
                    <Flag className="w-3 h-3 text-accent-cyan" />
                    <span>SUB-TEAM TELEMETRY</span>
                  </span>
                  <span className="text-[9px] text-accent-cyan font-mono">
                    {role === 'admin' ? '5 TEAMS ACTIVE' : 'ASSIGNED'}
                  </span>
                </div>

                {/* Admin: 5-Team Mini Matrix | Non-Admin: Assigned Team Hero Card (RLS-Safe) */}
                {role === 'admin' ? (
                  <div className="grid grid-cols-5 gap-1 p-2 rounded-lg bg-cyber-bg-alt border border-cyber-border">
                    {sourceGroups.slice(0, 5).map((team) => {
                      const teamTasks = tasks.filter((t) => t.group_id === team.id);
                      const completed = teamTasks.filter((t) => t.status === 'done' || t.status === 'approved').length;
                      const pct = teamTasks.length > 0 ? Math.round((completed / teamTasks.length) * 100) : 0;
                      return (
                        <button
                          key={team.id || team.slug}
                          onClick={() => onSelectGroup?.(team.slug)}
                          title={`${team.name}: ${pct}% completed (${completed}/${teamTasks.length} tasks)`}
                          className="flex flex-col items-center gap-1 p-1 rounded hover:bg-cyber-surface transition-colors cursor-pointer group"
                        >
                          <span
                            className="w-2 h-2 rounded-full transition-transform group-hover:scale-125"
                            style={{ backgroundColor: team.color_accent || '#00D9FF' }}
                          />
                          <span className="text-[8px] font-mono text-cyber-muted group-hover:text-cyber-primary truncate w-full text-center">
                            {team.slug.slice(0, 3).toUpperCase()}
                          </span>
                          <span className="text-[8px] font-mono font-bold" style={{ color: team.color_accent }}>
                            {pct}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div 
                    className="p-2.5 rounded-lg bg-cyber-bg-alt border border-cyber-border flex items-center justify-between transition-colors"
                    style={{ borderLeftWidth: '3px', borderLeftColor: userTeamColor }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
                        style={{ backgroundColor: userTeamColor }}
                      />
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-semibold text-cyber-primary truncate">
                          {currentGroupName}
                        </div>
                        <div className="text-[9px] font-mono text-cyber-muted">
                          {tasks.length} sub-team {tasks.length === 1 ? 'task' : 'tasks'}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-cyber-surface text-cyber-secondary border border-cyber-border uppercase font-semibold">
                      {role}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Collapsed Telemetry Pips (RLS-Safe Double Encoded, density tier responsive) */
              <div className="flex flex-col items-center gap-1 rail-pips-block" title="5 Formula Student Sub-Teams Telemetry Status">
                <div className="flex items-center gap-1">
                  {sourceGroups.slice(0, 5).map((team) => {
                    const isUserTeam = currentGroupName.includes(team.name.replace(/^Technical - |^Operations - /, '')) || currentGroupName === team.name;
                    const isHighlighted = role === 'admin' || isUserTeam;

                    return (
                      <button
                        key={team.id || team.slug}
                        onClick={() => onSelectGroup?.(team.slug)}
                        title={role === 'admin' 
                          ? `${team.name} (Sub-Team Telemetry)`
                          : isUserTeam ? `${team.name} (Assigned Sub-Team)` : `${team.name} (Formula Student Sub-Team)`
                        }
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
            )}

            {/* Bottom Console Telemetry Status (Double Encoded: Icon + Color + Text) */}
            <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
              {onOpenStyleGuide && (
                <button
                  onClick={onOpenStyleGuide}
                  title="Open Cyber Racing Style Guide (/styleguide)"
                  aria-label="Open Design System Style Guide"
                  className="p-1 rounded text-cyber-muted hover:text-accent-cyan hover:bg-cyber-surface-hover transition-colors cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>
              )}

              <div 
                className="flex items-center gap-1.5 ml-auto cursor-default px-2 py-0.5 rounded bg-cyber-bg/80 border border-cyber-border" 
                title={`Telemetry Status: ${connectionStatus.toUpperCase()} (@zewailcity.edu.eg)`}
              >
                {connectionStatus === 'online' ? (
                  <>
                    <Radio className="w-3 h-3 text-accent-lime animate-pulse" />
                    <span className="text-accent-lime font-bold text-[9px]">
                      {isOpen ? 'SYSTEM ONLINE' : 'LIVE'}
                    </span>
                  </>
                ) : connectionStatus === 'reconnecting' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-accent-yellow animate-ping" />
                    <span className="text-accent-yellow font-bold text-[9px]">
                      {isOpen ? 'RECONNECTING' : 'SYNC'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-accent-red" />
                    <span className="text-accent-red font-bold text-[9px]">
                      {isOpen ? 'SYSTEM OFFLINE' : 'OFF'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
