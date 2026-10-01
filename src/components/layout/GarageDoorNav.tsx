import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronUp, 
  X, 
  Radio, 
  User
} from 'lucide-react';
import { UserRole } from '../../lib/database.types';
import { NavTab, getVisibleNavItems } from '../../config/navigation';
import { SUB_TEAMS } from '../../lib/constants';

export interface GarageDoorNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  role: UserRole;
  currentGroupName?: string;
  userName?: string;
  unreadCount?: number;
  onOpenProfile?: () => void;
}

export const GarageDoorNav: React.FC<GarageDoorNavProps> = ({
  activeTab,
  onTabChange,
  role,
  currentGroupName = 'Technical - Vehicle Dynamics',
  userName = 'Engineer',
  unreadCount = 0,
  onOpenProfile,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleItems = getVisibleNavItems(role);
  const activeItem = visibleItems.find((item) => item.id === activeTab) || visibleItems[0];

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
    // Double requestAnimationFrame guarantees the DOM mounts offscreen before transitioning in
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

  return (
    <aside className="md:hidden" aria-label="Mobile Navigation Command Console">
      {/* ─── CLOSED STATE: THUMB-ARC FLOATING GLASS PILL ─── */}
      <div 
        className={`fixed bottom-3 inset-x-3 sm:inset-x-6 z-40 max-w-md mx-auto pb-[env(safe-area-inset-bottom)] pointer-events-auto transition-all duration-200 ease-out ${
          isMounted ? 'opacity-0 pointer-events-none translate-y-3' : 'opacity-100 pointer-events-auto translate-y-0'
        }`}
      >
        <button
          onClick={openGarage}
          aria-label="Open PitLane Command Console"
          aria-expanded={isVisible}
            className="w-full min-h-[56px] px-3.5 py-2 rounded-2xl bg-cyber-surface/95 dark:bg-midnight-900/95 backdrop-blur-md border border-cyber-border shadow-cyber-elevated flex items-center justify-between gap-3 active:scale-[0.98] transition-all cursor-pointer group"
          >
            {/* Left: ZC Motorsport Badge */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-cyber-bg border border-accent-cyan/60 group-hover:border-accent-cyan shadow-[0_0_10px_rgba(0,217,255,0.25)] shrink-0 transition-colors">
                <span className="font-display font-black text-accent-cyan text-xs tracking-tighter">ZC</span>
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
              </div>

              {/* Active Tab Name & Icon */}
              <div className="flex items-center gap-2 text-left">
                <div className="p-1 rounded bg-accent-cyan/15 text-accent-cyan">
                  <ActiveIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-xs tracking-wider text-cyber-primary uppercase leading-tight">
                    {activeItem.label}
                  </span>
                  <span className="font-mono text-[11px] text-cyber-secondary tracking-tight truncate max-w-[150px]">
                    {activeItem.subtitle}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Unread Chat Badge + Status LED + Garage Door Open Chevron */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-accent-red text-white flex items-center justify-center shadow-sm animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}

              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyber-bg border border-cyber-border font-mono text-[11px] text-accent-lime font-bold">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                <span>LIVE</span>
              </div>

              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyber-surface-elevated text-cyber-secondary group-hover:text-accent-cyan border border-cyber-border transition-colors">
                <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
              </div>
            </div>
          </button>
        </div>

      {/* ─── OPEN STATE: GARAGE DOOR OVERLAY PANEL (~70VH BOTTOM SHEET) ─── */}
      {isMounted && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="PitLane Mobile Command Center"
          className="fixed inset-0 z-40 flex flex-col justify-end"
        >
          {/* Solid Dark Scrim (Zero GPU Blur Overhead) */}
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
              relative z-50 w-full max-h-[78vh] bg-cyber-surface dark:bg-midnight-950 border-t border-cyber-border-strong rounded-t-3xl shadow-2xl flex flex-col overflow-hidden
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
            <div className="px-4 pb-3 flex items-center justify-between border-b border-cyber-border/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyber-bg border border-accent-cyan/60 shadow-[0_0_8px_rgba(0,217,255,0.25)]">
                  <span className="font-display font-black text-accent-cyan text-xs">ZC</span>
                </div>
                <div>
                  <h2 className="font-display font-black text-xs tracking-wider text-cyber-primary uppercase">
                    PitLane // Mobile Command
                  </h2>
                  <p className="text-[11px] font-mono text-cyber-secondary">
                    Telemetry & Navigation Dock
                  </p>
                </div>
              </div>

              <button
                onClick={closeGarage}
                aria-label="Close Mobile Navigation"
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyber-surface-elevated text-cyber-muted hover:text-cyber-primary border border-cyber-border transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2x3 Grid of Navigation Destinations (Odd Last Tile Spanned) */}
            <div className="p-3.5 overflow-y-auto max-h-[50vh]">
              <div className="grid grid-cols-2 gap-2.5">
                {visibleItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const showBadge = item.badgeKey === 'chat' && unreadCount > 0;
                  const isOddLast = visibleItems.length % 2 !== 0 && index === visibleItems.length - 1;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`
                        relative min-h-[64px] p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer
                        active:scale-95 focus:outline-none focus:ring-1 focus:ring-accent-cyan
                        ${isOddLast ? 'col-span-2' : ''}
                        ${
                          isActive
                            ? 'bg-cyber-surface-elevated text-cyber-primary border-accent-cyan shadow-[0_0_12px_rgba(0,217,255,0.2)]'
                            : 'bg-cyber-bg-alt/70 text-cyber-secondary border-cyber-border hover:border-cyber-border-strong hover:bg-cyber-surface-hover'
                        }
                      `}
                    >
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <div className="absolute top-2 bottom-2 left-0 w-[3px] bg-accent-cyan rounded-r-full" />
                      )}

                      {/* Icon */}
                      <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-accent-cyan/15 text-accent-cyan' : 'bg-cyber-bg text-cyber-muted'}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`font-display text-xs tracking-wider truncate ${isActive ? 'font-bold text-accent-cyan' : 'font-medium'}`}>
                            {item.shortLabel || item.label}
                          </span>
                          {showBadge && (
                            <span className="px-1.5 py-0.2 rounded-full text-[11px] font-mono font-bold bg-accent-red text-white shadow-sm">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-cyber-secondary block truncate">
                          {item.subtitle}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
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
                  <div className="text-[11px] font-mono font-semibold text-cyber-primary truncate">
                    {currentGroupName}
                  </div>
                  <div className="text-[11px] font-mono text-cyber-secondary">
                    ROLE: {role.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* User Profile Button */}
              {onOpenProfile ? (
                <button
                  onClick={() => {
                    onOpenProfile();
                    closeGarage();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyber-surface border border-cyber-border text-xs font-mono text-cyber-primary hover:border-accent-cyan transition-colors cursor-pointer shrink-0"
                >
                  <User className="w-3.5 h-3.5 text-accent-cyan" />
                  <span className="truncate max-w-[80px]">{userName}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1 font-mono text-[11px] text-accent-lime font-bold">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>ONLINE</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
