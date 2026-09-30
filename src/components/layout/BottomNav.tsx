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
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)] backdrop-blur-md bg-cyber-surface/95 border-t border-cyber-border shadow-cyber">
      {/* Top micro border with subtle cyan accent */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent" />
      
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-lg
                transition-all duration-150 active:scale-95 cursor-pointer
                ${
                  isActive
                    ? 'text-accent-cyan'
                    : 'text-cyber-muted hover:text-cyber-primary'
                }
              `}
            >
              {/* Active Top Line Indicator */}
              {isActive && (
                <div className="absolute top-0 inset-x-4 h-[2px] bg-accent-cyan rounded-full shadow-[0_0_6px_rgba(0,217,255,0.6)]" />
              )}

              <div className="relative mt-0.5">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-105' : ''}`} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-2 px-1 rounded-full text-[9px] font-mono font-bold bg-accent-red text-white shadow-sm">
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
