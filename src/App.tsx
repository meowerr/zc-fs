import React, { useState, useRef, useEffect } from 'react';
import { F1HorizontalTransition } from './components/transitions/F1HorizontalTransition';
import { AppShell } from './components/layout/AppShell';
import { NavTab } from './components/layout/BottomNav';
import { MissionControl } from './components/dashboard/MissionControl';
import { AuthScreen } from './components/auth/AuthScreen';
import { PendingApprovalView } from './components/auth/PendingApprovalView';
import { AdminApprovalHub, SUB_TEAMS } from './components/admin/AdminApprovalHub';
import { TasksHub } from './components/tasks/TasksHub';
import { ChatView } from './components/chat/ChatView';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { ToastContainer } from './components/common/ToastContainer';
import { RoleGuideModal } from './components/common/RoleGuideModal';
import { StyleGuide } from './components/styleguide/StyleGuide';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { useRealtimeChat } from './hooks/useRealtimeChat';
import { useNotifications } from './hooks/useNotifications';
import { SubmissionReviewStatus, SubmissionType, TaskType, TaskPriority } from './lib/database.types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isStyleGuideOpen, setIsStyleGuideOpen] = useState<boolean>(() => {
    return window.location.pathname === '/styleguide' || window.location.hash === '#styleguide';
  });
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const prevUserRef = useRef<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setIsStyleGuideOpen(window.location.pathname === '/styleguide' || window.location.hash === '#styleguide');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const {
    currentUser,
    allProfiles,
    allGroups,
    signIn,
    signUp,
    signOut,
    approveUser,
    rejectUser,
    createGroup,
    removeMemberFromGroup,
  } = useAuth();

  const {
    tasks,
    submissions,
    comments,
    createTask,
    updateTaskStatus,
    deleteTask,
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

  // ─── F1 Horizontal Reveal Transition Trigger ───
  useEffect(() => {
    if (currentUser && !prevUserRef.current) {
      const alreadyTransitioned = sessionStorage.getItem('zcfs_login_transitioned');
      if (!alreadyTransitioned && currentUser.status === 'approved') {
        setIsTransitioning(true);
      }
    } else if (!currentUser && prevUserRef.current) {
      sessionStorage.removeItem('zcfs_login_transitioned');
      setIsTransitioning(false);
    }
    prevUserRef.current = currentUser ? currentUser.id : null;
  }, [currentUser]);

  // 0. Styleguide Direct Route Check
  if (isStyleGuideOpen) {
    return (
      <StyleGuide
        onBack={() => {
          setIsStyleGuideOpen(false);
          if (window.location.pathname === '/styleguide') {
            window.history.pushState(null, '', '/');
          }
        }}
      />
    );
  }

  // 1. Not Authenticated -> Show Auth Screen (strictly Supabase Auth)
  if (!currentUser) {
    return (
      <AuthScreen
        onLogin={signIn}
        onSignup={signUp}
      />
    );
  }

  // 2. Authenticated but Pending Approval -> Show Pending Screen
  if (currentUser.status === 'pending') {
    return (
      <PendingApprovalView
        user={currentUser}
        onSignOut={signOut}
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

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    addNotification('announcement', 'Deliverable Removed', 'Task and associated data deleted from database.');
  };

  const authenticatedContent = (
    <>
      <AppShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentRole={currentUser.role}
        userName={currentUser.full_name}
        groupName={groupDisplayName}
        unreadCount={0}
        onOpenProfile={signOut}
        notificationCount={notifUnreadCount}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenStyleGuide={() => {
          setIsStyleGuideOpen(true);
          window.history.pushState(null, '', '/styleguide');
        }}
        groups={allGroups}
        tasks={tasks}
      >
        {/* View Switching based on active tab & role */}
        {activeTab === 'admin' && currentUser.role === 'admin' ? (
          <AdminApprovalHub
            profiles={allProfiles}
            groups={allGroups}
            onApproveUser={async (userId, groupId, role) => {
              await approveUser(userId, groupId, role);
              addNotification('announcement', 'Engineer Approved', 'User activated and assigned to sub-team.');
            }}
            onRejectUser={rejectUser}
            onCreateGroup={createGroup}
            onRemoveMember={removeMemberFromGroup}
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
            onDeleteTask={handleDeleteTask}
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
            }}
            onStartDirectMessage={startDirectMessage}
          />
        ) : (
          <MissionControl
            currentUser={currentUser}
            tasks={tasks}
            onNavigateTab={setActiveTab}
            onCreateTaskClick={() => setActiveTab('tasks')}
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

  if (isTransitioning) {
    return (
      <F1HorizontalTransition
        direction="left-to-right"
        duration={1450}
        onComplete={() => {
          setIsTransitioning(false);
          sessionStorage.setItem('zcfs_login_transitioned', 'true');
        }}
      >
        {authenticatedContent}
      </F1HorizontalTransition>
    );
  }

  return authenticatedContent;
};

export default App;
