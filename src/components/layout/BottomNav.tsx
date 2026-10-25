import React from 'react';
import { UserRole } from '../../lib/database.types';
import { getNavItems, NavTab } from './navConfig';

export type { NavTab } from './navConfig';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  role: UserRole;
  badges?: Partial<Record<NavTab, number>>;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, role, badges = {} }) => {
  const items = getNavItems(role);

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)] backdrop-blur-md bg-cyber-surface/95 border-t border-cyber-border"
    >
      <ul className="flex items-stretch justify-around px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const badge = badges[item.id] ?? 0;

          return (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                onClick={() => onTabChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={badge > 0 ? `${item.label}, ${badge} pending` : item.label}
                className={`
                  relative w-full flex flex-col items-center justify-center gap-1 h-16 rounded-lg
                  transition-colors duration-fast cursor-pointer
                  ${isActive ? 'text-accent-cyan' : 'text-cyber-muted hover:text-cyber-primary'}
                `}
              >
                <span
                  className={`absolute top-0 inset-x-5 h-0.5 rounded-full bg-accent-cyan transition-opacity duration-base ${isActive ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden="true"
                />
                <span
                  className={`relative flex items-center justify-center w-12 h-7 rounded-full transition-colors duration-base ${isActive ? 'bg-accent-cyan/10' : ''}`}
                  aria-hidden="true"
                >
                  <Icon className="w-5 h-5" />
                  {badge > 0 && (
                    <span className="absolute -top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-red text-on-accent font-mono text-2xs font-bold flex items-center justify-center ring-2 ring-cyber-surface">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                <span className={`text-2xs tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`} aria-hidden="true">
                  {item.shortLabel}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
