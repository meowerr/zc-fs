import React, { useState, useEffect } from 'react';
import { TopHeader } from './TopHeader';
import { BottomNav, NavTab } from './BottomNav';
import { Sidebar } from './Sidebar';
import { UserRole } from '../../lib/database.types';

interface AppShellProps {
  children: React.ReactNode;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentRole: UserRole;
  userName: string;
  groupName?: string;
  unreadCount?: number;
  onOpenProfile?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeTab,
  onTabChange,
  currentRole,
  userName,
  groupName,
  unreadCount = 0,
  onOpenProfile,
}) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('zcfs_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('zcfs_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('zcfs_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-chrome-100 to-chrome-50 dark:from-midnight-900 dark:to-midnight-950 text-chrome-900 dark:text-chrome-50 font-sans transition-colors duration-300">
      {/* Background Micro-Grid Texture */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Header Telemetry HUD */}
      <TopHeader
        currentRole={currentRole}
        userName={userName}
        groupName={groupName}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onOpenProfile={onOpenProfile}
      />

      {/* Body: Desktop Sidebar + Main Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          role={currentRole}
          currentGroupName={groupName}
          unreadCount={unreadCount}
        />

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Hidden on md+) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        role={currentRole}
        unreadCount={unreadCount}
      />
    </div>
  );
};
