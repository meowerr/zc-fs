import React, { useState, useEffect } from 'react';
import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';
import { NavTab } from '../../config/navigation';
import { Sidebar } from './Sidebar';
import { HybridRacingRail } from './HybridRacingRail';
import { UserRole, Group, Task } from '../../lib/database.types';

// Instant Rollback Flag: toggle to false if legacy permanent sidebar is needed
const USE_HYBRID_RACING_RAIL = true;

interface AppShellProps {
  children: React.ReactNode;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentRole: UserRole;
  userName: string;
  groupName?: string;
  unreadCount?: number;
  onOpenProfile?: () => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  onOpenGuide?: () => void;
  onOpenStyleGuide?: () => void;
  onOpenSearch?: () => void;
  groups?: Group[];
  tasks?: Task[];
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
  notificationCount = 0,
  onOpenNotifications,
  onOpenGuide,
  onOpenStyleGuide,
  onOpenSearch,
  groups,
  tasks,
}) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('zcfs_theme') !== 'light';
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
    <div className="min-h-screen flex flex-col bg-cyber-bg text-cyber-primary font-sans transition-colors duration-200">
      {/* Background Subtle Tech-Grid Texture */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
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
        notificationCount={notificationCount}
        onOpenNotifications={onOpenNotifications}
        onOpenGuide={onOpenGuide}
        onOpenStyleGuide={onOpenStyleGuide}
        onOpenSearch={onOpenSearch}
      />

      {/* Navigation & Main Content Container */}
      {USE_HYBRID_RACING_RAIL ? (
        <>
          {/* Floating Collapsible Racing Rail (Desktop & Tablet) */}
          <HybridRacingRail
            activeTab={activeTab}
            onTabChange={onTabChange}
            role={currentRole}
            currentGroupName={groupName}
            unreadCount={unreadCount}
            groups={groups}
            tasks={tasks}
            onOpenStyleGuide={onOpenStyleGuide}
          />

          {/* Body Container with Fixed Rail Offset (Zero Reflow Guarantee) */}
          <div 
            className="flex-1 flex w-full transition-all duration-200"
            style={{ paddingLeft: 'var(--rail-offset, 0px)' }}
          >
            <main className="flex-1 p-3.5 sm:p-5 md:p-6 pb-24 md:pb-8 max-w-7xl mx-auto w-full overflow-x-hidden">
              {children}
            </main>
          </div>
        </>
      ) : (
        /* Legacy Layout (Rollback Target) */
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar
            activeTab={activeTab}
            onTabChange={onTabChange}
            role={currentRole}
            currentGroupName={groupName}
            unreadCount={unreadCount}
            groups={groups}
            tasks={tasks}
            onOpenStyleGuide={onOpenStyleGuide}
          />

          <main className="flex-1 p-3.5 sm:p-5 md:p-6 pb-24 md:pb-8 max-w-full overflow-x-hidden">
            {children}
          </main>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Hidden on md+, replaced by Garage Door in Slice 5) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        role={currentRole}
        unreadCount={unreadCount}
      />
    </div>
  );
};

