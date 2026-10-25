import React from 'react';
import { Palette } from 'lucide-react';
import { UserRole, Group, Task } from '../../lib/database.types';
import { SUB_TEAMS } from '../../lib/constants';
import { getNavItems, NavTab } from './navConfig';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  role: UserRole;
  currentGroupName?: string;
  badges?: Partial<Record<NavTab, number>>;
  groups?: Group[];
  tasks?: Task[];
  onOpenStyleGuide?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  role,
  currentGroupName = 'Formula Student Team',
  badges = {},
  groups,
  tasks = [],
  onOpenStyleGuide,
}) => {
  const items = getNavItems(role);
  const sourceGroups = groups && groups.length > 0 ? groups : SUB_TEAMS;

  const subTeams = sourceGroups.map((g) => {
    const groupTasks = tasks.filter((t) => t.group_id === g.id);
    const completed = groupTasks.filter((t) => t.status === 'done' || t.status === 'approved').length;
    return {
      id: g.id,
      name: g.name.replace(/^Technical - |^Operations - /, ''),
      color: g.color_accent || 'var(--accent-cyan)',
      total: groupTasks.length,
      completed,
      progress: groupTasks.length === 0 ? 0 : Math.round((completed / groupTasks.length) * 100),
    };
  });

  return (
    <aside className="hidden md:flex flex-col w-60 lg:w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 border-r border-cyber-border px-3 py-4 overflow-y-auto">
      <nav aria-label="Primary">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badge = badges[item.id] ?? 0;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    group relative w-full flex items-center gap-3 h-11 px-3 rounded-lg text-left
                    transition-colors duration-fast cursor-pointer
                    ${isActive
                      ? 'bg-accent-cyan/10 text-cyber-primary'
                      : 'text-cyber-secondary hover:text-cyber-primary hover:bg-cyber-surface-hover'}
                  `}
                >
                  <span
                    className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent-cyan transition-opacity duration-base ${isActive ? 'opacity-100' : 'opacity-0'}`}
                    aria-hidden="true"
                  />
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-accent-cyan' : 'text-cyber-muted group-hover:text-cyber-secondary'}`}
                    aria-hidden="true"
                  />
                  <span className={`flex-1 truncate text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                  {badge > 0 && (
                    <span className="min-w-[22px] h-5 px-1.5 rounded-full text-2xs font-mono font-bold bg-accent-red text-on-accent flex items-center justify-center">
                      <span className="sr-only">{badge} pending</span>
                      <span aria-hidden="true">{badge > 99 ? '99+' : badge}</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-labelledby="sidebar-subteams" className="mt-6 pt-5 border-t border-cyber-border">
        <h2 id="sidebar-subteams" className="micro-label px-3 mb-3">
          Sub-team progress
        </h2>
        <ul className="space-y-3 px-3">
          {subTeams.map((team) => (
            <li key={team.id}>
              <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: team.color }} aria-hidden="true" />
                  <span className="text-cyber-primary truncate">{team.name}</span>
                </span>
                <span className="font-mono text-2xs text-cyber-muted shrink-0">
                  {team.total === 0 ? 'No tasks' : `${team.completed}/${team.total}`}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`${team.name} completion`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={team.progress}
                className="h-1.5 rounded-full bg-cyber-bg-alt border border-cyber-border overflow-hidden"
              >
                <div
                  className="h-full rounded-full transition-[width] duration-slow ease-out"
                  style={{ width: `${team.progress}%`, backgroundColor: team.color }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-auto pt-5 space-y-2">
        <div className="px-3 py-2.5 rounded-lg bg-cyber-bg-alt border border-cyber-border">
          <p className="micro-label">Your scope</p>
          <p className="text-sm font-semibold text-cyber-primary mt-0.5 truncate">{currentGroupName}</p>
        </div>
        {onOpenStyleGuide && (
          <button
            type="button"
            onClick={onOpenStyleGuide}
            className="w-full h-9 flex items-center gap-2 px-3 rounded-lg text-xs text-cyber-muted hover:text-cyber-primary hover:bg-cyber-surface-hover transition-colors duration-fast cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5" aria-hidden="true" />
            Design system
          </button>
        )}
      </div>
    </aside>
  );
};
