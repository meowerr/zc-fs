import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  MessageSquare, 
  Users, 
  ShieldAlert, 
  Gauge, 
  Flag,
  Sparkles
} from 'lucide-react';
import { NavTab } from './BottomNav';
import { UserRole } from '../../lib/database.types';
import { SegmentedGauge } from '../common/SegmentedGauge';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  role: UserRole;
  currentGroupName?: string;
  onSelectGroup?: (groupSlug: string) => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  role,
  currentGroupName = 'Technical - Vehicle Dynamics',
  unreadCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Mission Control', subtitle: 'Overview & Velocity', icon: LayoutDashboard },
    { id: 'tasks' as NavTab, label: 'Tasks Telemetry', subtitle: 'Review & Deliverables', icon: CheckSquare },
    { id: 'chat' as NavTab, label: 'Pit Wall Chat', subtitle: 'Channels & DMs', icon: MessageSquare, badge: unreadCount },
    { id: 'team' as NavTab, label: 'Team Directory', subtitle: '5 Sub-Teams & Roles', icon: Users },
    ...(role === 'admin' ? [{ id: 'admin' as NavTab, label: 'Admin Hub', subtitle: 'Approvals & Access', icon: ShieldAlert }] : []),
  ];

  const subTeams = [
    { name: 'Vehicle Dynamics', slug: 'vehicle-dynamics', color: '#2F6BFF', progress: 75 },
    { name: 'Aerodynamics', slug: 'aerodynamics', color: '#22E4F0', progress: 60 },
    { name: 'LV Electronics', slug: 'electronics', color: '#FFC53D', progress: 85 },
    { name: 'Powertrain', slug: 'powertrain', color: '#FF4FA3', progress: 40 },
    { name: 'Business & Ops', slug: 'business-ops', color: '#B6FF3B', progress: 90 },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-[calc(100vh-4rem)] sticky top-16 backdrop-blur-xl bg-white/60 dark:bg-midnight-950/60 border-r border-chrome-300/80 dark:border-white/10 p-4 overflow-y-auto">
      {/* Navigation Links */}
      <div className="space-y-1.5">
        <div className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-chrome-900/50 dark:text-white/40 flex items-center justify-between">
          <span>Telemetry Navigation</span>
          <Sparkles className="w-3 h-3 text-telemetry-aqua" />
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer
                ${
                  isActive
                    ? 'bg-white/80 dark:bg-white/10 text-telemetry-blue dark:text-telemetry-aqua shadow-sm border border-telemetry-blue/20 dark:border-telemetry-aqua/30'
                    : 'text-chrome-900/70 dark:text-white/70 hover:bg-white/40 dark:hover:bg-white/5 hover:text-chrome-900 dark:hover:text-white'
                }
              `}
            >
              <div className={`p-2 rounded-lg ${isActive ? 'bg-telemetry-blue text-white shadow-neon-blue/40' : 'bg-black/5 dark:bg-white/5'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-bold tracking-wider truncate">
                    {item.label}
                  </span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-telemetry-pink text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-sans text-chrome-900/50 dark:text-white/40 truncate">
                  {item.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sub-teams Telemetry Progress Monitor */}
      <div className="mt-8 pt-6 border-t border-chrome-300/60 dark:border-white/10">
        <div className="px-2 mb-3 flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-chrome-900/60 dark:text-white/50">
          <span className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-telemetry-blue" />
            5 Sub-Teams Status
          </span>
          <Flag className="w-3 h-3 text-[#8ED91E]" />
        </div>

        <div className="space-y-3">
          {subTeams.map((team) => (
            <div key={team.slug} className="p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/5">
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="font-medium text-chrome-900 dark:text-white truncate">
                  {team.name}
                </span>
                <span className="font-mono text-[10px] font-bold" style={{ color: team.color }}>
                  {team.progress}%
                </span>
              </div>
              <SegmentedGauge value={team.progress} totalSegments={6} showPercent={false} />
            </div>
          ))}
        </div>
      </div>

      {/* Active Group Scoping Footer */}
      <div className="mt-auto pt-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-white/70 to-chrome-100/40 dark:from-midnight-900/90 dark:to-midnight-800/80 border border-chrome-300/80 dark:border-white/10 shadow-sm">
          <div className="text-[10px] font-mono text-chrome-900/50 dark:text-white/40 uppercase tracking-wider">
            Active Group Scope
          </div>
          <div className="text-xs font-bold text-chrome-900 dark:text-white mt-0.5 truncate">
            {currentGroupName}
          </div>
        </div>
      </div>
    </aside>
  );
};
