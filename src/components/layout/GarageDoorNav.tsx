import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen,
  Palette,
  ChevronUp, 
  ChevronRight,
  X, 
  Radio, 
  User,
  Users,
  ShieldAlert,
  LogOut,
  Menu,
  Sun,
  Moon
} from 'lucide-react';
import { UserRole } from '../../lib/database.types';
import { NavTab, getVisibleNavItems } from '../../config/navigation';
import { SUB_TEAMS, triggerHaptic } from '../../lib/constants';
import { ZfsMonogram } from '../brand/ZfsMonogram';

// Instant Rollback Flag: toggle to false if floating thumb-arc pill is needed
const USE_MOBILE_TAB_BAR = true;
const PRIMARY_TABS: NavTab[] = ['dashboard', 'tasks', 'chat', 'docs'];
const BAR_LABEL: Record<string, string> = { dashboard: 'Control', tasks: 'Tasks', chat: 'Chat', docs: 'Docs' };

export interface GarageDoorNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  role: UserRole;
  currentGroupName?: string;
  userName?: string;
  unreadCount?: number;
  onOpenProfile?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onSignOut?: () => void;
  onOpenGuide?: () => void;
  onOpenStyleGuide?: () => void;
}

export const GarageDoorNav: React.FC<GarageDoorNavProps> = ({
  activeTab,
  onTabChange,
  role,
  currentGroupName = 'Technical - Vehicle Dynamics',
  userName = 'Engineer',
  unreadCount = 0,
  onOpenProfile,
  isDarkMode,
  onToggleTheme,
  onSignOut,
  onOpenGuide,
  onOpenStyleGuide,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleItems = getVisibleNavItems(role);
  const activeItem = visibleItems.find((item) => item.id === activeTab) || visibleItems[0];
  const isMoreActive = !PRIMARY_TABS.includes(activeTab);

  // Keyboard open detection via visualViewport
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      setIsKeyboardOpen(vv.height < window.innerHeight * 0.75);
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  // Resolve team accent color
  const userTeamColor = useMemo(() => {
    const matched = SUB_TEAMS.find(
      (g) => currentGroupName.includes(g.name.replace(/^Technical - |^Operations - /, '')) || currentGroupName === g.name
    );
    return matched?.color_accent || '#00D9FF';
  }, [currentGroupName]);

  const openGarage = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  };

  const closeGarage = () => {
    setIsVisible(false);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setIsMounted(false);
      setDragOffset(0);
    }, 240);
  };

  // Escape key closes sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        closeGarage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  // Prevent background scroll when Garage Door is open/mounted
  useEffect(() => {
    if (isMounted) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMounted]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Touch Drag-to-Dismiss Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || touchStartYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartYRef.current;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 70) {
      closeGarage();
    } else {
      setDragOffset(0);
    }
    touchStartYRef.current = null;
    isDraggingRef.current = false;
  };

  const handleSelectTab = (tabId: NavTab) => {
    onTabChange(tabId);
    closeGarage();
  };

  const ActiveIcon = activeItem.icon;

  const act = (fn?: () => void) => () => { triggerHaptic(8); closeGarage(); fn?.(); };

  const moreListItems = [
    { id: 'team', label: 'Team Directory', subtitle: 'Roster & roles', icon: Users, isActive: activeTab === 'team', onClick: () => { triggerHaptic(8); handleSelectTab('team'); } },
    ...(role === 'admin' ? [{ id: 'admin', label: 'Admin Hub', subtitle: 'Governance', icon: ShieldAlert, isActive: activeTab === 'admin', onClick: () => { triggerHaptic(8); handleSelectTab('admin'); } }] : []),
    ...(onOpenProfile ? [{ id: 'profile', label: userName || 'Profile', subtitle: `${currentGroupName} • ${role.toUpperCase()}`, icon: User, isActive: false, onClick: act(onOpenProfile) }] : []),
    ...(onOpenGuide ? [{ id: 'guide', label: 'Protocol Guide', subtitle: 'Operations manual', icon: BookOpen, isActive: false, onClick: act(onOpenGuide) }] : []),
    ...(onOpenStyleGuide ? [{ id: 'styleguide', label: 'Style Guide', subtitle: 'Design system', icon: Palette, isActive: false, onClick: act(onOpenStyleGuide) }] : []),
    ...(onToggleTheme ? [{
      id: 'theme',
      label: 'Appearance',
      subtitle: isDarkMode ? 'Switch to Chrome (Light)' : 'Switch to Midnight (Dark)',
      icon: isDarkMode ? Sun : Moon,
      isActive: false,
      badge: <span className="px-2 py-0.5 rounded text-label font-mono bg-cyber-bg border border-cyber-border text-cyber-secondary">{isDarkMode ? 'Dark' : 'Light'}</span>,
      onClick: () => { triggerHaptic(8); onToggleTheme(); }
    }] : []),
    ...(onSignOut ? [{ id: 'signout', label: 'Sign Out', subtitle: 'End session', icon: LogOut, isActive: false, onClick: act(onSignOut) }] : []),
  ];

  return (
    <aside className="md:hidden" aria-label="Mobile Navigation Command Console">
      {/* ─── CLOSED STATE: 5-TAB BOTTOM NAVIGATION BAR (OR THUMB-ARC PILL FOR ROLLBACK) ─── */}
      {USE_MOBILE_TAB_BAR ? (
        <nav
          className={`md:hidden fixed bottom-0 inset-x-0 z-40 bg-cyber-surface/95 dark:bg-midnight-950/95 backdrop-blur-md border-t border-cyber-border pb-[env(safe-area-inset-bottom)] mobile-bottom-bar shadow-cyber transition-all duration-200 ${
            isKeyboardOpen ? 'hidden' : ''
          }`}
          aria-label="Mobile Bottom Navigation"
        >
          <div className="grid grid-cols-5">
            {PRIMARY_TABS.map((tabId) => {
              const item = visibleItems.find((i) => i.id === tabId);
              if (!item) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const showBadge = item.badgeKey === 'chat' && unreadCount > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    triggerHaptic(8);
                    onTabChange(item.id);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-[56px] min-w-0 flex flex-col items-center justify-center gap-0.5 px-1 transition-colors cursor-pointer relative ${
                    isActive ? 'text-accent-cyan' : 'text-cyber-secondary hover:text-cyber-primary'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 inset-x-2 h-[2px] bg-accent-cyan rounded-full shadow-[0_0_6px_rgba(0,217,255,0.6)]" />
                  )}
                  <div className={`relative flex items-center justify-center transition-all ${
                    isActive ? 'px-3 py-1 rounded-full bg-accent-cyan/15 text-accent-cyan' : 'p-1'
                  }`}>
                    <Icon className="w-5 h-5 shrink-0" />
                    {showBadge && (
                      <span className="absolute -top-1 -right-2 px-1 rounded-full text-label font-mono font-medium bg-accent-red text-white shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="max-w-full truncate font-sans font-semibold text-label leading-none tracking-normal">
                    {BAR_LABEL[item.id] ?? item.label}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => {
                triggerHaptic(8);
                openGarage();
              }}
              aria-label="More navigation destinations"
              className={`min-h-[56px] min-w-0 flex flex-col items-center justify-center gap-0.5 px-1 transition-colors cursor-pointer relative ${
                isMoreActive ? 'text-accent-cyan' : 'text-cyber-secondary hover:text-cyber-primary'
              }`}
            >
              {isMoreActive && (
                <div className="absolute top-0 inset-x-2 h-[2px] bg-accent-cyan rounded-full shadow-[0_0_6px_rgba(0,217,255,0.6)]" />
              )}
              <div className={`relative flex items-center justify-center transition-all ${
                isMoreActive ? 'px-3 py-1 rounded-full bg-accent-cyan/15 text-accent-cyan' : 'p-1'
              }`}>
                <Menu className="w-5 h-5 shrink-0" />
              </div>
              <span className="max-w-full truncate font-sans font-semibold text-label leading-none tracking-normal">
                More
              </span>
            </button>
          </div>
        </nav>
      ) : (
        /* Rollback: Thumb-Arc Floating Glass Pill */
        <div 
          className={`fixed bottom-3 inset-x-3 sm:inset-x-6 z-40 max-w-md mx-auto pb-[env(safe-area-inset-bottom)] pointer-events-auto transition-all duration-200 ease-out garage-door-pill ${
            isMounted ? 'opacity-0 pointer-events-none translate-y-3' : 'opacity-100 pointer-events-auto translate-y-0'
          }`}
        >
          <button
            onClick={() => {
              triggerHaptic(8);
              openGarage();
            }}
            aria-label="Open PitLane Command Console"
            aria-expanded={isVisible}
            className="w-full min-h-[56px] px-3.5 py-2 rounded-2xl bg-cyber-surface/95 dark:bg-midnight-900/95 backdrop-blur-md border border-cyber-border shadow-cyber-elevated flex items-center justify-between gap-3 active:scale-[0.98] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-cyber-bg border border-accent-cyan/60 group-hover:border-accent-cyan shadow-[0_0_10px_rgba(0,217,255,0.25)] shrink-0 transition-colors">
                <span className="font-display font-black text-accent-cyan text-xs tracking-tighter">ZC</span>
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
              </div>

              <div className="flex items-center gap-2 text-left">
                <div className="p-1 rounded bg-accent-cyan/15 text-accent-cyan">
                  <ActiveIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-xs tracking-wider text-cyber-primary uppercase leading-tight">
                    {activeItem.label}
                  </span>
                  <span className="font-mono text-label text-cyber-secondary tracking-tight truncate max-w-[150px]">
                    {activeItem.subtitle}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-label font-mono font-medium bg-accent-red text-white flex items-center justify-center shadow-sm animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}

              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyber-surface-elevated text-cyber-secondary group-hover:text-accent-cyan border border-cyber-border transition-colors">
                <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ─── OPEN STATE: GARAGE DOOR OVERLAY PANEL (~70VH BOTTOM SHEET) ─── */}
      {isMounted && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="PitLane Mobile Command Center"
          className="fixed inset-0 z-40 flex flex-col justify-end"
        >
          {/* Solid Dark Scrim */}
          <div 
            onClick={closeGarage}
            className={`fixed inset-0 bg-black/75 transition-opacity duration-300 ease-out ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />

          {/* Rising Garage Door Sheet */}
          <div
            style={
              dragOffset > 0
                ? { transform: `translateY(${dragOffset}px)`, transition: 'none' }
                : undefined
            }
            className={`
              relative z-50 w-full max-h-[78dvh] bg-cyber-surface dark:bg-midnight-950 border-t border-cyber-border-strong rounded-t-3xl shadow-2xl flex flex-col overflow-hidden
              ${
                dragOffset > 0
                  ? ''
                  : isVisible
                  ? 'garage-door-sheet translate-y-0'
                  : 'garage-door-sheet-closing translate-y-full'
              }
            `}
          >
            {/* Hydraulic Shutter Top Laser Rim */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-accent-cyan to-transparent shadow-[0_0_12px_rgba(0,217,255,0.8)] opacity-90" />

            {/* Drag Handle Bar */}
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              aria-label="Swipe down to close navigation"
              className="pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shrink-0 select-none group"
            >
              <div className="w-16 h-1.5 rounded-full bg-cyber-border-strong/90 dark:bg-white/30 group-hover:bg-accent-cyan/80 transition-colors" />
            </div>

            {/* Garage Door Header */}
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="px-4 pb-3 flex items-center justify-between border-b border-cyber-border/80 shrink-0 cursor-grab"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyber-bg border border-cyber-border p-1 shrink-0">
                  <ZfsMonogram glow={false} className="w-full h-auto" />
                </div>
                <div>
                  <h2 className="font-display font-black text-xs tracking-wider text-cyber-primary uppercase">
                    PitLane Command
                  </h2>
                  <p className="text-label font-sans text-cyber-secondary">
                    Navigation & Workspace Actions
                  </p>
                </div>
              </div>

              <button
                onClick={closeGarage}
                aria-label="Close Mobile Navigation"
                className="tap-target rounded-lg flex items-center justify-center bg-cyber-surface-elevated text-cyber-muted hover:text-cyber-primary border border-cyber-border transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scannable 56px Row List of Destinations */}
            <div className="p-3.5 overflow-y-auto max-h-[50dvh] space-y-1.5">
              {moreListItems.map((item) => {
                const Icon = item.icon;
                const isActive = !!item.isActive;
                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`w-full min-h-[56px] px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-[0.99] focus:outline-none focus:ring-1 focus:ring-accent-cyan ${
                      isActive
                        ? 'bg-cyber-surface-elevated text-cyber-primary border-accent-cyan shadow-[0_0_12px_rgba(0,217,255,0.18)]'
                        : 'bg-cyber-bg-alt/50 text-cyber-secondary border-cyber-border hover:border-cyber-border-strong hover:bg-cyber-surface-hover'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30'
                            : 'bg-cyber-bg text-cyber-secondary border border-cyber-border'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className={`font-sans font-semibold text-sm block truncate leading-tight ${
                            isActive ? 'text-accent-cyan' : 'text-cyber-primary'
                          }`}
                        >
                          {item.label}
                        </span>
                        <span className="font-sans text-xs text-cyber-secondary block truncate leading-tight mt-0.5">
                          {item.subtitle}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {'badge' in item ? item.badge : null}
                      <ChevronRight className="w-4 h-4 text-cyber-muted" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Telemetry & Sub-team Quick Info */}
            <div className="mt-auto px-4 py-3 bg-cyber-bg-alt/90 border-t border-cyber-border flex items-center justify-between pb-[calc(env(safe-area-inset-bottom)+12px)] shrink-0">
              {/* Sub-team accent indicator */}
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
                  style={{ backgroundColor: userTeamColor }}
                />
                <div className="truncate">
                  <div className="text-label font-mono font-medium text-cyber-primary truncate">
                    {currentGroupName}
                  </div>
                  <div className="text-label font-mono text-cyber-secondary">
                    ROLE: {role.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-1 font-mono text-label text-accent-lime font-medium">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
