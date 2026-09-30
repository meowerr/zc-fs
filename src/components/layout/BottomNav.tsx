import React from 'react';
import { LayoutDashboard, CheckSquare, MessageSquare, Users, ShieldAlert } from 'lucide-react';
import { UserRole } from '../../lib/database.types';

export type NavTab = 'dashboard' | 'tasks' | 'chat' | 'team' | 'admin';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  role: UserRole;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  role,
  unreadCount = 0,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Control', icon: LayoutDashboard },
    { id: 'tasks' as NavTab, label: 'Tasks', icon: CheckSquare },
    { id: 'chat' as NavTab, label: 'Pit Wall', icon: MessageSquare, badge: unreadCount },
    { id: 'team' as NavTab, label: 'Team', icon: Users },
    ...(role === 'admin' ? [{ id: 'admin' as NavTab, label: 'Admin', icon: ShieldAlert }] : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl bg-white/80 dark:bg-midnight-950/85 border-t border-chrome-300/80 dark:border-white/10 shadow-[0_-8px_20px_rgba(0,0,0,0.06)]">
      {/* Top metallic shimmer line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-telemetry-aqua/50 to-transparent" />
      
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex flex-col items-center justify-center min-w-[56px] min-h-[50px] py-1 px-2 rounded-xl
                transition-all duration-200 active:scale-95 cursor-pointer
                ${
                  isActive
                    ? 'text-telemetry-blue dark:text-telemetry-aqua'
                    : 'text-chrome-900/60 dark:text-white/50 hover:text-chrome-900 dark:hover:text-white'
                }
              `}
            >
              {/* Active Pill Glow Bubble */}
              {isActive && (
                <div className="absolute inset-0 bg-telemetry-blue/10 dark:bg-telemetry-aqua/10 rounded-xl -z-10 border border-telemetry-blue/20 dark:border-telemetry-aqua/20" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-telemetry-pink text-white shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] font-display tracking-wider mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
