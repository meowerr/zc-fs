import React, { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { NavTab } from './components/layout/BottomNav';
import { MissionControlDemo } from './components/dashboard/MissionControlDemo';
import { AuthScreen } from './components/auth/AuthScreen';
import { PendingApprovalView } from './components/auth/PendingApprovalView';
import { AdminApprovalHub, SUB_TEAMS } from './components/admin/AdminApprovalHub';
import { TasksHub } from './components/tasks/TasksHub';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { UserRole } from './lib/database.types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const {
    currentUser,
    allProfiles,
    signIn,
    signUp,
    signOut,
    switchDemoPersona,
    approveUser,
    rejectUser,
  } = useAuth();

  const {
    tasks,
    submissions,
    comments,
    createTask,
    updateTaskStatus,
    submitWork,
    reviewSubmission,
    addComment,
  } = useTasks(currentUser);

  // 1. Not Authenticated -> Show Auth Screen
  if (!currentUser) {
    return (
      <AuthScreen
        onLogin={signIn}
        onSignup={signUp}
        onSelectDemoPersona={switchDemoPersona}
      />
    );
  }

  // 2. Authenticated but Pending Approval -> Show Pending Screen
  if (currentUser.status === 'pending') {
    return (
      <PendingApprovalView
        user={currentUser}
        onSignOut={signOut}
        onSwitchToAdmin={() => switchDemoPersona('admin@zewailcity.edu.eg')}
      />
    );
  }

  // Find user's assigned group name
  const assignedGroup = SUB_TEAMS.find((g) => g.id === currentUser.group_id);
  const groupDisplayName = currentUser.role === 'admin'
    ? 'Club Administration'
    : (assignedGroup ? assignedGroup.name : 'Formula Student Team');

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      currentRole={currentUser.role}
      userName={currentUser.full_name}
      groupName={groupDisplayName}
      unreadCount={2}
      onOpenProfile={signOut}
    >
      {/* View Switching based on active tab & role */}
      {activeTab === 'admin' && currentUser.role === 'admin' ? (
        <AdminApprovalHub
          profiles={allProfiles}
          onApproveUser={approveUser}
          onRejectUser={rejectUser}
        />
      ) : activeTab === 'tasks' ? (
        <TasksHub
          currentUser={currentUser}
          tasks={tasks}
          teamMembers={allProfiles}
          submissions={submissions}
          comments={comments}
          onCreateTask={createTask}
          onUpdateStatus={updateTaskStatus}
          onSubmitWork={submitWork}
          onReviewSubmission={reviewSubmission}
          onAddComment={addComment}
        />
      ) : (
        <MissionControlDemo
          currentRole={currentUser.role}
          onChangeRole={(newRole: UserRole) => {
            const persona = allProfiles.find((p) => p.role === newRole);
            if (persona) {
              switchDemoPersona(persona.email);
            }
          }}
          activeTab={activeTab}
          onNavigateTab={setActiveTab}
        />
      )}
    </AppShell>
  );
};

export default App;
