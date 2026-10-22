import React, { useState, useRef, useEffect } from 'react';
import { F1HorizontalTransition } from './components/transitions/F1HorizontalTransition';
import { AppShell } from './components/layout/AppShell';
import { NavTab } from './components/layout/BottomNav';
// Code-split auth screens to keep initial application bundle lean
const AuthScreen = React.lazy(() => import('./components/auth/AuthScreen').then((m) => ({ default: m.AuthScreen })));
const PendingApprovalView = React.lazy(() => import('./components/auth/PendingApprovalView').then((m) => ({ default: m.PendingApprovalView })));
import { MissionControl } from './components/dashboard/MissionControl';
import { TasksHub } from './components/tasks/TasksHub';
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
const LegalView = React.lazy(() => import('./components/legal/LegalView').then((m) => ({ default: m.LegalView })));
const ChatView = React.lazy(() => import('./components/chat/ChatView').then((m) => ({ default: m.ChatView })));
const TeamDirectory = React.lazy(() => import('./components/team/TeamDirectory').then((m) => ({ default: m.TeamDirectory })));
import { ZfsMonogram } from './components/brand/ZfsMonogram';

const SuspenseFallback = () => (
  <div className="py-24 text-center space-y-4">
    <div className="w-14 h-auto mx-auto p-1">
      <ZfsMonogram pulse={true} className="w-full h-auto" />
    </div>
    <span className="font-mono text-xs text-cyber-muted uppercase tracking-wider block">
      Initializing Telemetry Subsystem...
    </span>
  </div>
);

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p && ['dashboard', 'tasks', 'chat', 'docs', 'team', 'admin'].includes(p)) {
        return p as NavTab;
      }
    } catch {}
    return 'dashboard';
  });
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isStyleGuideOpen, setIsStyleGuideOpen] = useState<boolean>(() => {
    return window.location.pathname === '/styleguide' || window.location.hash === '#styleguide';
  });
  const [legalRoute, setLegalRoute] = useState<'privacy' | 'terms' | null>(() => {
    const p = window.location.pathname;
    if (p === '/privacy') return 'privacy';
    if (p === '/terms') return 'terms';
    return null;
  });
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const prevUserRef = useRef<string | null>(null);
  const scrollPositionsRef = useRef<Record<string, number>>({});

  // Scroll restoration per navigation tab
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionsRef.current[activeTab] = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  useEffect(() => {
    const target = scrollPositionsRef.current[activeTab] || 0;
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: target, behavior: 'instant' as ScrollBehavior });
    });
    return () => cancelAnimationFrame(raf);
  }, [activeTab]);

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
      const p = window.location.pathname;
      if (p === '/privacy') setLegalRoute('privacy');
      else if (p === '/terms') setLegalRoute('terms');
      else setLegalRoute(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const {
    currentUser,
    allProfiles,
    allGroups,
    loading,
    error: authError,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    clearError,
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
    loading: tasksLoading,
    reloadTasks,
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
    refreshDocuments,
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

  // 0a. Styleguide Direct Route Check
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

  // 0b. Legal & Compliance Direct Route Check (/privacy, /terms)
  if (legalRoute) {
    return (
      <React.Suspense fallback={<SuspenseFallback />}>
        <LegalView
          initialTab={legalRoute}
          onBack={() => {
            setLegalRoute(null);
            if (window.location.pathname === '/privacy' || window.location.pathname === '/terms') {
              window.history.pushState(null, '', '/');
            }
          }}
        />
      </React.Suspense>
    );
  }

  // 1. Authenticating Screen (Prevents flash of login screen during PKCE code exchange)
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 bg-cyber-bg text-cyber-primary relative">
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />
        <div className="w-full max-w-sm text-center space-y-4 relative z-10">
          <div className="w-16 h-auto mx-auto p-2 rounded-xl bg-cyber-surface/70 border border-cyber-border shadow-cyber-elevated">
            <ZfsMonogram pulse={true} className="w-full h-auto" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display font-black text-lg text-cyber-primary uppercase tracking-wider">
              Authenticating...
            </h2>
            <p className="font-mono text-xs text-cyber-muted">
              Synchronizing telemetry session with PitLane
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Not Authenticated -> Show Auth Screen (Google primary, email secondary)
  if (!currentUser) {
    return (
      <React.Suspense fallback={<SuspenseFallback />}>
        <AuthScreen
          onLogin={signIn}
          onSignup={signUp}
          onGoogleSignIn={signInWithGoogle}
          authError={authError}
          onClearError={clearError}
        />
      </React.Suspense>
    );
  }

  // 3. Authenticated but Pending Approval -> Show Pending Screen
  if (currentUser.status === 'pending') {
    return (
      <React.Suspense fallback={<SuspenseFallback />}>
        <PendingApprovalView
          user={currentUser}
          onSignOut={signOut}
        />
      </React.Suspense>
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
    if (taskData.assigneeIds && taskData.assigneeIds.length > 0) {
      for (const aId of taskData.assigneeIds) {
        if (aId !== currentUser.id) {
          addNotification('task_assigned', 'New Assignment', `You were assigned to "${taskData.title}".`, link, aId);
        }
      }
    }
  };

  const handleSubmitWork = async (taskId: string, type: SubmissionType, content: string, notes: string) => {
    await submitWork(taskId, type, content, notes);
    addNotification('submission_received', 'Deliverable Submitted', 'Your engineering deliverable has been queued for review.', `/tasks?taskId=${taskId}`);
    const targetTask = tasks.find((t) => t.id === taskId);
    if (targetTask) {
      const groupHeads = allProfiles.filter((p) => p.group_id === targetTask.group_id && p.role === 'head');
      for (const head of groupHeads) {
        if (head.id !== currentUser.id) {
          addNotification('submission_received', 'Review Queued', `${currentUser.full_name} submitted work for "${targetTask.title}".`, `/tasks?taskId=${taskId}`, head.id);
        }
      }
    }
  };

  const handleReviewSubmission = async (
    submissionId: string,
    taskId: string,
    status: SubmissionReviewStatus,
    feedback: string
  ) => {
    await reviewSubmission(submissionId, taskId, status, feedback);
    const targetTask = tasks.find((t) => t.id === taskId);
    const targetSub = submissions[taskId]?.find((s: any) => s.id === submissionId);
    const recipientId = targetSub?.submitted_by;

    if (status === 'approved') {
      addNotification('review_result', 'Work Approved', 'Deliverable approved! Progress recorded.', `/tasks?taskId=${taskId}`);
      if (recipientId && recipientId !== currentUser.id) {
        addNotification('review_result', 'Deliverable Approved', `Your work on "${targetTask?.title || 'task'}" was approved.`, `/tasks?taskId=${taskId}`, recipientId);
      }
    } else {
      addNotification('task_due_soon', 'Revisions Requested', 'Reviewer requested changes. See feedback.', `/tasks?taskId=${taskId}`);
      if (recipientId && recipientId !== currentUser.id) {
        addNotification('task_due_soon', 'Changes Requested', `Revisions requested on "${targetTask?.title || 'task'}": ${feedback || 'See feedback.'}`, `/tasks?taskId=${taskId}`, recipientId);
      }
    }
  };

  const handleAddComment = async (taskId: string, content: string) => {
    await addComment(taskId, content);
    const targetTask = tasks.find((t) => t.id === taskId);
    if (targetTask) {
      const notifyIds = new Set<string>();
      if (targetTask.creator_id && targetTask.creator_id !== currentUser.id) {
        notifyIds.add(targetTask.creator_id);
      }
      targetTask.assignees?.forEach((a) => {
        if (a.id !== currentUser.id) notifyIds.add(a.id);
      });
      for (const id of notifyIds) {
        addNotification('announcement', 'New Discussion Note', `${currentUser.full_name} commented on "${targetTask.title}".`, `/tasks?taskId=${taskId}`, id);
      }
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
        onSignOut={signOut}
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
              loading={tasksLoading}
              onRefresh={reloadTasks}
              initialTaskId={activeTaskId}
              onClearInitialTaskId={() => setActiveTaskId(null)}
              onCreateTask={handleCreateTask}
              onUpdateStatus={updateTaskStatus}
              onSubmitWork={handleSubmitWork}
              onReviewSubmission={handleReviewSubmission}
              onAddComment={handleAddComment}
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
              loading={loading}
              onStartDirectMessage={startDirectMessage}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'docs' ? (
            <DocumentHub
              currentUser={currentUser}
              documents={documents}
              groups={allGroups}
              loading={docsLoading}
              onRefresh={refreshDocuments}
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
