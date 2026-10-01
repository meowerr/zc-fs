import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  MessageSquare, 
  FileText,
  Users, 
  ShieldAlert, 
  Gauge, 
  Flag,
  Palette
} from 'lucide-react';
import { NavTab } from './BottomNav';
import { UserRole, Group, Task } from '../../lib/database.types';
import { SegmentedGauge } from '../common/SegmentedGauge';
import { SUB_TEAMS } from '../../lib/constants';

interface SidebarProps {
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

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  role,
  currentGroupName = 'Technical - Vehicle Dynamics',
  unreadCount = 0,
  groups,
  tasks = [],
  onOpenStyleGuide,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Mission Control', subtitle: 'Overview & Velocity', icon: LayoutDashboard },
    { id: 'tasks' as NavTab, label: 'Tasks Telemetry', subtitle: 'Review & Deliverables', icon: CheckSquare },
    { id: 'chat' as NavTab, label: 'Pit Wall Chat', subtitle: 'Channels & DMs', icon: MessageSquare, badge: unreadCount },
    { id: 'docs' as NavTab, label: 'Engineering Hub', subtitle: 'CAD & Specs Library', icon: FileText },
    { id: 'team' as NavTab, label: 'Team Directory', subtitle: '5 Sub-Teams & Roles', icon: Users },
    ...(role === 'admin' ? [{ id: 'admin' as NavTab, label: 'Admin Hub', subtitle: 'Approvals & Access', icon: ShieldAlert }] : []),
  ];

  const sourceGroups = (groups && groups.length > 0) ? groups : SUB_TEAMS;

  // Real progress calculated directly from loaded tasks
  const subTeams = sourceGroups.map((g) => {
    const groupTasks = tasks.filter((t) => t.group_id === g.id);
    const completedTasks = groupTasks.filter(
      (t) => t.status === 'done' || t.status === 'approved'
    ).length;
    const progress = groupTasks.length === 0
      ? 0
      : Math.round((completedTasks / groupTasks.length) * 100);

    const shortName = g.name.replace(/^Technical - |^Operations - /, '');

    return {
      id: g.id,
      name: shortName,
      fullName: g.name,
      slug: g.slug,
      color: g.color_accent || '#00D9FF',
      totalTasks: groupTasks.length,
      completedTasks,
      progress,
    };
  });

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] sticky top-14 sm:top-16 bg-cyber-surface border-r border-cyber-border p-3.5 overflow-y-auto">
      {/* Micro Console Header */}
      <div className="px-2 py-1 mb-2 font-mono text-[10px] uppercase tracking-wider text-cyber-muted flex items-center justify-between border-b border-cyber-border pb-2">
        <span className="flex items-center gap-1.5">
          <span className="text-accent-cyan">//</span>
          <span>CONSOLE // NAV</span>
        </span>
        <span className="text-[9px] text-cyber-chrome">PITLANE-OS</span>
      </div>

      {/* Navigation Links */}
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 cursor-pointer
                ${
                  isActive
                    ? 'bg-cyber-surface-elevated text-cyber-primary border-l-2 border-l-accent-cyan border-y border-r border-cyber-border shadow-cyber-sm'
                    : 'text-cyber-secondary hover:text-cyber-primary hover:bg-cyber-surface-hover border border-transparent'
                }
              `}
            >
              <div className={`p-1.5 rounded ${isActive ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-cyber-muted'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`font-display text-xs tracking-wider truncate ${isActive ? 'font-bold text-accent-cyan' : 'font-medium'}`}>
                    {item.label}
                  </span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-accent-red text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-cyber-muted truncate">
                  {item.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sub-teams Telemetry Progress Monitor */}
      <div className="mt-6 pt-4 border-t border-cyber-border">
        <div className="px-2 mb-2.5 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-cyber-muted">
          <span className="flex items-center gap-1.5">
            <Gauge className="w-3 h-3 text-accent-cyan" />
            <span>SUB-TEAMS // {subTeams.length}</span>
          </span>
          <Flag className="w-3 h-3 text-accent-lime opacity-80" />
        </div>

        <div className="space-y-2">
          {subTeams.map((team) => (
            <div 
              key={team.id || team.slug} 
              className="p-2 rounded-lg bg-cyber-bg-alt border border-cyber-border transition-colors hover:border-cyber-border-strong"
            >
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  {/* Subtle team accent marker */}
                  <span 
                    className="w-1.5 h-1.5 rounded-full shrink-0" 
                    style={{ backgroundColor: team.color }} 
                  />
                  <span className="font-sans font-medium text-cyber-primary text-[11px] truncate">
                    {team.name}
                  </span>
                </div>
                <span 
                  className="font-mono text-[10px] font-bold shrink-0" 
                  style={{ color: team.color }}
                >
                  {team.progress}%
                </span>
              </div>
              <SegmentedGauge 
                value={team.progress} 
                totalSegments={6} 
                showPercent={false} 
                accentColor={team.color} 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Style Guide Shortcut (if provided) */}
      {onOpenStyleGuide && (
        <div className="mt-4 pt-3 border-t border-cyber-border">
          <button
            onClick={onOpenStyleGuide}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-cyber-secondary hover:text-accent-cyan hover:bg-cyber-surface-hover border border-cyber-border/60 transition-all cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 text-accent-cyan" />
            <span>SYSTEM // STYLEGUIDE</span>
          </button>
        </div>
      )}

      {/* Active Group Scoping Footer */}
      <div className="mt-auto pt-4">
        <div className="p-2.5 rounded-lg bg-cyber-bg-alt border border-cyber-border">
          <div className="text-[9px] font-mono text-cyber-muted uppercase tracking-wider flex items-center gap-1">
            <span className="text-accent-cyan">●</span> SCOPE // ACTIVE
          </div>
          <div className="text-xs font-semibold text-cyber-primary mt-0.5 truncate">
            {currentGroupName}
          </div>
        </div>
      </div>
    </aside>
  );
};
