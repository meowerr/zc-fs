import React, { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { NavTab } from './components/layout/BottomNav';
import { MissionControlDemo } from './components/dashboard/MissionControlDemo';
import { AuthScreen } from './components/auth/AuthScreen';
import { PendingApprovalView } from './components/auth/PendingApprovalView';
import { AdminApprovalHub, SUB_TEAMS } from './components/admin/AdminApprovalHub';
import { TasksHub } from './components/tasks/TasksHub';
import { ChatView } from './components/chat/ChatView';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { ToastContainer } from './components/common/ToastContainer';
import { RoleGuideModal } from './components/common/RoleGuideModal';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { useRealtimeChat } from './hooks/useRealtimeChat';
import { useNotifications } from './hooks/useNotifications';
import { UserRole, SubmissionReviewStatus, SubmissionType, TaskType, TaskPriority } from './lib/database.types';
import { isDemoMode } from './lib/supabase';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

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

  const {
    accessibleChannels,
    activeChannelId,
    activeConversationId,
    setActiveChannel,
    setActiveConversation,
    currentChannel,
    currentConversation,
    otherParticipant,
    conversations,
    currentMessages,
    sendMessage,
    startDirectMessage,
    canPost,
  } = useRealtimeChat(currentUser, allProfiles);

  const {
    notifications,
    toasts,
    unreadCount: notifUnreadCount,
    isAudioMuted,
    toggleMute,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeToast,
    requestWebPush,
  } = useNotifications(currentUser);

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
        onSwitchToAdmin={isDemoMode ? () => switchDemoPersona('admin@zewailcity.edu.eg') : undefined}
      />
    );
  }

  // Find user's assigned group name
  const assignedGroup = SUB_TEAMS.find((g) => g.id === currentUser.group_id);
  const groupDisplayName = currentUser.role === 'admin'
    ? 'Club Administration'
    : (assignedGroup ? assignedGroup.name : 'Formula Student Team');

  // Wrapped actions with notifications
  const handleCreateTask = async (taskData: {
    title: string;
    description: string;
    groupId: string;
    taskType: TaskType;
    priority: TaskPriority;
    deadline: string;
    links: Array<{ title: string; url: string }>;
    assigneeIds: string[];
    assignees: any[];
  }) => {
    await createTask(taskData);
    addNotification('task_assigned', 'Task Dispatched', `New task "${taskData.title}" created for team.`);
  };

  const handleSubmitWork = async (taskId: string, type: SubmissionType, content: string, notes: string) => {
    await submitWork(taskId, type, content, notes);
    addNotification('submission_received', 'Deliverable Submitted', 'Your engineering deliverable has been queued for review.');
  };

  const handleReviewSubmission = async (
    submissionId: string,
    taskId: string,
    status: SubmissionReviewStatus,
    feedback: string
  ) => {
    await reviewSubmission(submissionId, taskId, status, feedback);
    if (status === 'approved') {
      addNotification('review_result', 'Work Approved', 'Deliverable approved! Progress recorded.');
    } else {
      addNotification('task_due_soon', 'Revisions Requested', 'Reviewer requested changes. See feedback.');
    }
  };

  return (
    <>
      <AppShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentRole={currentUser.role}
        userName={currentUser.full_name}
        groupName={groupDisplayName}
        unreadCount={currentMessages.length > 0 ? 1 : 0}
        onOpenProfile={signOut}
        notificationCount={notifUnreadCount}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      >
        {/* View Switching based on active tab & role */}
        {activeTab === 'admin' && currentUser.role === 'admin' ? (
          <AdminApprovalHub
            profiles={allProfiles}
            onApproveUser={async (userId, groupId, role) => {
              await approveUser(userId, groupId, role);
              addNotification('announcement', 'Engineer Approved', 'User activated and assigned to sub-team.');
            }}
            onRejectUser={rejectUser}
          />
        ) : activeTab === 'tasks' ? (
          <TasksHub
            currentUser={currentUser}
            tasks={tasks}
            teamMembers={allProfiles}
            submissions={submissions}
            comments={comments}
            onCreateTask={handleCreateTask}
            onUpdateStatus={updateTaskStatus}
            onSubmitWork={handleSubmitWork}
            onReviewSubmission={handleReviewSubmission}
            onAddComment={addComment}
          />
        ) : activeTab === 'chat' ? (
          <ChatView
            currentUser={currentUser}
            allProfiles={allProfiles}
            accessibleChannels={accessibleChannels}
            activeChannelId={activeChannelId}
            activeConversationId={activeConversationId}
            currentChannel={currentChannel}
            currentConversation={currentConversation}
            otherParticipant={otherParticipant}
            conversations={conversations}
            messages={currentMessages}
            canPost={canPost}
            onSelectChannel={setActiveChannel}
            onSelectConversation={setActiveConversation}
            onSendMessage={async (content, attachment) => {
              await sendMessage(content, attachment);
              addNotification('mention', 'Message Transmitted', 'Telemetry packet sent.');
            }}
            onStartDirectMessage={startDirectMessage}
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

      {/* Floating Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        unreadCount={notifUnreadCount}
        isAudioMuted={isAudioMuted}
        onToggleMute={toggleMute}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onRequestWebPush={requestWebPush}
      />

      {/* Real-time Floating Toast Banners */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Role Operations Guide Modal */}
      <RoleGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        defaultRole={currentUser.role}
      />
    </>
  );
};

export default App;
