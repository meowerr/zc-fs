import React, { useState, useRef, useEffect } from 'react';
import { F1HorizontalTransition } from './components/transitions/F1HorizontalTransition';
import { AppShell } from './components/layout/AppShell';
import { NavTab } from './components/layout/BottomNav';
import { MissionControl } from './components/dashboard/MissionControl';
import { AuthScreen } from './components/auth/AuthScreen';
import { PendingApprovalView } from './components/auth/PendingApprovalView';
import { TasksHub } from './components/tasks/TasksHub';
import { ChatView } from './components/chat/ChatView';
import { TeamDirectory } from './components/team/TeamDirectory';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { ToastContainer } from './components/common/ToastContainer';
import { RoleGuideModal } from './components/common/RoleGuideModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { useRealtimeChat } from './hooks/useRealtimeChat';
import { useNotifications } from './hooks/useNotifications';
import { useDocuments } from './hooks/useDocuments';
import { SUB_TEAMS } from './lib/constants';
import { SubmissionReviewStatus, SubmissionType, TaskType, TaskPriority } from './lib/database.types';

// Code-split heavy workspace hubs to keep initial mobile bundle under strict 50KB main JS budget
const AdminApprovalHub = React.lazy(() => import('./components/admin/AdminApprovalHub').then((m) => ({ default: m.AdminApprovalHub })));
const DocumentHub = React.lazy(() => import('./components/documents/DocumentHub').then((m) => ({ default: m.DocumentHub })));
const StyleGuide = React.lazy(() => import('./components/styleguide/StyleGuide').then((m) => ({ default: m.StyleGuide })));

const SuspenseFallback = () => (
  <div className="py-24 text-center space-y-3">
    <div className="w-8 h-8 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin mx-auto" />
    <span className="font-mono text-xs text-cyber-muted uppercase tracking-wider">
      Initializing Telemetry Subsystem...
    </span>
  </div>
);

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isStyleGuideOpen, setIsStyleGuideOpen] = useState<boolean>(() => {
    return window.location.pathname === '/styleguide' || window.location.hash === '#styleguide';
  });
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const prevUserRef = useRef<string | null>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    reassignMember,
    updateUserStatus,
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

  const {
    documents,
    loading: docsLoading,
    uploadDocument,
    deleteDocument,
  } = useDocuments(currentUser);

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
      <React.Suspense fallback={<SuspenseFallback />}>
        <StyleGuide
          onBack={() => {
            setIsStyleGuideOpen(false);
            if (window.location.pathname === '/styleguide') {
              window.history.pushState(null, '', '/');
            }
          }}
        />
      </React.Suspense>
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
    const created = await createTask(taskData);
    const link = created?.id ? `/tasks?taskId=${created.id}` : '/tasks';
    addNotification('task_assigned', 'Task Dispatched', `New task "${taskData.title}" created for team.`, link);
  };

  const handleSubmitWork = async (taskId: string, type: SubmissionType, content: string, notes: string) => {
    await submitWork(taskId, type, content, notes);
    addNotification('submission_received', 'Deliverable Submitted', 'Your engineering deliverable has been queued for review.', `/tasks?taskId=${taskId}`);
  };

  const handleReviewSubmission = async (
    submissionId: string,
    taskId: string,
    status: SubmissionReviewStatus,
    feedback: string
  ) => {
    await reviewSubmission(submissionId, taskId, status, feedback);
    if (status === 'approved') {
      addNotification('review_result', 'Work Approved', 'Deliverable approved! Progress recorded.', `/tasks?taskId=${taskId}`);
    } else {
      addNotification('task_due_soon', 'Revisions Requested', 'Reviewer requested changes. See feedback.', `/tasks?taskId=${taskId}`);
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
        userEmail={currentUser.email}
        groupName={groupDisplayName}
        unreadCount={0}
        onOpenProfile={signOut}
        notificationCount={notifUnreadCount}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenStyleGuide={() => {
          setIsStyleGuideOpen(true);
          window.history.pushState(null, '', '/styleguide');
        }}
        groups={allGroups}
        tasks={tasks}
      >
        <React.Suspense fallback={<SuspenseFallback />}>
          {/* View Switching based on active tab & role */}
          {activeTab === 'admin' && currentUser.role === 'admin' ? (
            <AdminApprovalHub
              currentUser={currentUser}
              profiles={allProfiles}
              groups={allGroups}
              onApproveUser={async (userId, groupId, role) => {
                await approveUser(userId, groupId, role);
                addNotification('announcement', 'Engineer Approved', 'User activated and assigned to sub-team.');
              }}
              onRejectUser={rejectUser}
              onCreateGroup={createGroup}
              onRemoveMember={removeMemberFromGroup}
              onReassignMember={reassignMember}
              onUpdateUserStatus={updateUserStatus}
            />
          ) : activeTab === 'tasks' ? (
            <TasksHub
              currentUser={currentUser}
              tasks={tasks}
              teamMembers={allProfiles}
              submissions={submissions}
              comments={comments}
              initialTaskId={activeTaskId}
              onClearInitialTaskId={() => setActiveTaskId(null)}
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
          ) : activeTab === 'team' ? (
            <TeamDirectory
              currentUser={currentUser}
              allProfiles={allProfiles}
              allGroups={allGroups}
              tasks={tasks}
              onStartDirectMessage={startDirectMessage}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'docs' ? (
            <DocumentHub
              currentUser={currentUser}
              documents={documents}
              groups={allGroups}
              loading={docsLoading}
              onUploadDocument={async (params) => {
                const res = await uploadDocument(params);
                addNotification('announcement', 'Asset Archived', `"${params.title}" committed to engineering library.`, '/docs');
                return res;
              }}
              onDeleteDocument={async (docId) => {
                await deleteDocument(docId);
                addNotification('announcement', 'Asset Removed', 'Document purged from engineering repository.');
              }}
            />
          ) : (
            <MissionControl
              currentUser={currentUser}
              tasks={tasks}
              allProfiles={allProfiles}
              allGroups={allGroups}
              submissions={submissions}
              onNavigateTab={setActiveTab}
              onCreateTaskClick={() => setActiveTab('tasks')}
            />
          )}
        </React.Suspense>
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
        onSelectNotification={(notif) => {
          setIsNotifDrawerOpen(false);
          if (notif.link) {
            if (notif.link.startsWith('/tasks')) {
              const match = notif.link.match(/taskId=([^&]+)/);
              if (match) {
                setActiveTaskId(match[1]);
              }
              setActiveTab('tasks');
              return;
            }
            if (notif.link.startsWith('/chat')) {
              setActiveTab('chat');
              return;
            }
            if (notif.link.startsWith('/docs')) {
              setActiveTab('docs');
              return;
            }
            if (notif.link.startsWith('/admin')) {
              setActiveTab('admin');
              return;
            }
          }
          if (['task_assigned', 'task_due_soon', 'submission_received', 'review_result'].includes(notif.type)) {
            setActiveTab('tasks');
          } else if (notif.type === 'announcement') {
            setActiveTab('chat');
          }
        }}
      />

      {/* Global Telemetry Search Modal (Cmd+K / Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentUser={currentUser}
        tasks={tasks}
        profiles={allProfiles}
        channels={accessibleChannels}
        documents={documents}
        onSelectTask={(task) => {
          setActiveTab('tasks');
          setActiveTaskId(task.id);
        }}
        onSelectProfile={(profile) => {
          startDirectMessage(profile.id);
          setActiveTab('chat');
        }}
        onSelectChannel={(channel) => {
          setActiveChannel(channel.id);
          setActiveTab('chat');
        }}
        onSelectDocument={(_doc) => {
          setActiveTab('docs');
        }}
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
