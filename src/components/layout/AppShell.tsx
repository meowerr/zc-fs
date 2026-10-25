import React, { useState, useEffect } from 'react';
import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { NavTab } from './navConfig';
import { UserRole, Group, Task } from '../../lib/database.types';

interface AppShellProps {
  children: React.ReactNode;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentRole: UserRole;
  userName: string;
  userEmail?: string;
  groupName?: string;
  badges?: Partial<Record<NavTab, number>>;
  onSignOut?: () => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  onOpenGuide?: () => void;
  onOpenStyleGuide?: () => void;
  groups?: Group[];
  tasks?: Task[];
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeTab,
  onTabChange,
  currentRole,
  userName,
  userEmail,
  groupName,
  badges,
  onSignOut,
  notificationCount = 0,
  onOpenNotifications,
  onOpenGuide,
  onOpenStyleGuide,
  groups,
  tasks,
}) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => localStorage.getItem('zcfs_theme') !== 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('zcfs_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleTabChange = (tab: NavTab) => {
    onTabChange(tab);
    window.scrollTo({ top: 0 });
    document.getElementById('main-content')?.focus({ preventScroll: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-cyber-bg text-cyber-primary font-sans">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <TopHeader
        currentRole={currentRole}
        userName={userName}
        userEmail={userEmail}
        groupName={groupName}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onSignOut={onSignOut}
        notificationCount={notificationCount}
        onOpenNotifications={onOpenNotifications}
        onOpenGuide={onOpenGuide}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          role={currentRole}
          currentGroupName={groupName}
          badges={badges}
          groups={groups}
          tasks={tasks}
          onOpenStyleGuide={onOpenStyleGuide}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-w-0 px-3 py-4 sm:p-5 lg:p-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-10 outline-none"
        >
          <div key={activeTab} className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} role={currentRole} badges={badges} />
    </div>
  );
};
