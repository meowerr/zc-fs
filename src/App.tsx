import React, { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { NavTab } from './components/layout/BottomNav';
import { MissionControlDemo } from './components/dashboard/MissionControlDemo';
import { UserRole } from './lib/database.types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('head');
  const [userName, setUserName] = useState<string>('Kareem Tarek');
  const [groupName, setGroupName] = useState<string>('Technical - Vehicle Dynamics');

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'admin') {
      setUserName('Dr. Mostafa (Advisor)');
      setGroupName('Club Administration');
    } else if (newRole === 'head') {
      setUserName('Kareem Tarek (Head)');
      setGroupName('Technical - Vehicle Dynamics');
    } else if (newRole === 'member') {
      setUserName('Omar Sherif (Member)');
      setGroupName('Technical - Vehicle Dynamics');
    } else if (newRole === 'pending') {
      setUserName('New Engineer');
      setGroupName('Unassigned (Pending)');
    }
  };

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      currentRole={currentRole}
      userName={userName}
      groupName={groupName}
      unreadCount={2}
    >
      <MissionControlDemo
        currentRole={currentRole}
        onChangeRole={handleRoleChange}
        activeTab={activeTab}
        onNavigateTab={setActiveTab}
      />
    </AppShell>
  );
};

export default App;
