import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  ChevronRight, 
  Plus, 
  MessageSquare, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders,
  Shield,
  Users,
  FileCheck,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { GhostButton } from '../common/GhostButton';
import { LedStatusChip } from '../common/LedStatusChip';
import { EmptyState } from '../common/EmptyState';
import { Profile, Task, Group, TaskSubmission } from '../../lib/database.types';
import { NavTab } from '../layout/BottomNav';
import { SUB_TEAMS } from '../../lib/constants';

interface MissionControlProps {
  currentUser: Profile;
  tasks: Task[];
  onNavigateTab: (tab: NavTab) => void;
  onCreateTaskClick?: () => void;
  allProfiles?: Profile[];
  allGroups?: Group[];
  submissions?: Record<string, TaskSubmission[]>;
}

export const MissionControl: React.FC<MissionControlProps> = ({
  currentUser,
  tasks,
  onNavigateTab,
  onCreateTaskClick,
  allProfiles = [],
  allGroups = [],
  submissions = {},
}) => {
  // Member cockpit toggle: 'my_work' vs 'team_feed'
  const [memberView, setMemberView] = useState<'my_work' | 'team_feed'>('my_work');

  const effectiveGroups = (allGroups && allGroups.length > 0) ? allGroups : (SUB_TEAMS as unknown as Group[]);
  const now = new Date();

  // Find user's sub-team
  const userTeam = effectiveGroups.find((g) => g.id === currentUser.group_id);

  // Filter tasks assigned to current user (Objective 5: "My Work")
  const myTasks = useMemo(() => {
    return tasks.filter((t) => t.assignees?.some((a) => a.id === currentUser.id));
  }, [tasks, currentUser.id]);

  // Tasks needing review (for Group Head and Admin)
  const needsReviewTasks = useMemo(() => {
    const fromStatus = tasks.filter((t) => t.status === 'submitted');
    const taskIdsWithPendingSubs = new Set<string>();
    Object.entries(submissions).forEach(([taskId, subs]) => {
      if (subs && subs.some((s) => s.review_status === 'pending')) {
        taskIdsWithPendingSubs.add(taskId);
      }
    });
    return tasks.filter((t) => fromStatus.some((f) => f.id === t.id) || taskIdsWithPendingSubs.has(t.id));
  }, [tasks, submissions]);

  // Tasks with changes requested (for Member)
  const changesRequestedTasks = useMemo(() => {
    return myTasks.filter((t) => t.status === 'changes_requested');
  }, [myTasks]);

  // Overdue tasks
  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => new Date(t.deadline) < now && t.status !== 'done' && t.status !== 'approved');
  }, [tasks, now]);

  // Pending user registrations (for Admin)
  const pendingRegistrations = useMemo(() => {
    return allProfiles.filter((p) => p.status === 'pending');
  }, [allProfiles]);

  // Tasks due soon (< 72 hours)
  const dueSoonTasks = useMemo(() => {
    const limit = new Date(now.getTime() + 72 * 3600 * 1000);
    return myTasks.filter((t) => {
      const d = new Date(t.deadline);
      return d >= now && d <= limit && t.status !== 'done' && t.status !== 'approved';
    });
  }, [myTasks, now]);

  // Relative deadline formatter
  const getDeadlineDisplay = (deadlineStr: string) => {
    const d = new Date(deadlineStr);
    const diffMs = d.getTime() - now.getTime();
    if (diffMs < 0) {
      const days = Math.abs(Math.floor(diffMs / (86400000)));
      return { text: `OVERDUE ${days}d`, isOverdue: true };
    }
    const days = Math.floor(diffMs / (86400000));
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    if (days === 0) return { text: `DUE IN ${hours}h`, isOverdue: false };
    return { text: `DUE IN ${days}d ${hours}h`, isOverdue: false };
  };

  // Recent tasks to show on main feed
  const displayTasks = useMemo(() => {
    if (currentUser.role === 'member' && memberView === 'my_work') {
      return myTasks.slice(0, 6);
    }
    return tasks.slice(0, 6);
  }, [currentUser.role, memberView, myTasks, tasks]);

  return (
    <div className="space-y-5">
      {/* ─── UNASSIGNED MEMBER ALERT BANNER ─── */}
      {currentUser.role !== 'admin' && !currentUser.group_id && currentUser.status === 'approved' && (
        <div className="p-4 rounded-xl bg-accent-yellow/10 border border-accent-yellow/30 text-cyber-primary flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent-yellow shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-xs uppercase font-mono text-accent-yellow">
              Awaiting Sub-Team Assignment
            </h4>
            <p className="text-xs text-cyber-secondary font-sans leading-relaxed">
              Your account has been verified by Club Administration. You are currently in the general engineer pool. An administrator will assign you to an engineering sub-team shortly. In the meantime, you can participate in `#announcements` or review the Team Directory.
            </p>
          </div>
        </div>
      )}

      {/* ─── HERO TELEMETRY BANNER (ROLE-AWARE) ─── */}
      <GlassCard variant="elevated" className="p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-cyber-bg-alt border border-cyber-border text-xs font-mono">
              <span className="text-accent-cyan font-bold">//</span>
              <span className="text-cyber-secondary uppercase tracking-widest text-[11px]">
                {currentUser.role === 'admin' 
                  ? 'CLUB // RACE CONTROL HQ' 
                  : currentUser.role === 'head'
                  ? `SUB-TEAM LEAD // ${userTeam?.name?.replace(/Technical - |Operations - /, '') || 'PIT WALL'}`
                  : `ENGINEERING COCKPIT // ${userTeam?.name?.replace(/Technical - |Operations - /, '') || 'WORKSPACE'}`}
              </span>
              <span className="text-accent-lime text-[10px]">● LIVE</span>
            </div>

            <h2 className="font-display font-black text-xl sm:text-2xl lg:text-3xl text-cyber-primary tracking-wider uppercase">
              {currentUser.role === 'admin' 
                ? 'Club Telemetry Command' 
                : currentUser.role === 'head'
                ? `${userTeam?.name?.replace(/Technical - |Operations - /, '') || 'Sub-Team'} Leadership`
                : 'My Engineering Workspace'}
            </h2>
            <p className="text-xs sm:text-sm text-cyber-secondary max-w-xl leading-relaxed">
              {currentUser.role === 'admin'
                ? 'High-level telemetry across all 5 technical and operational sub-teams. Govern registrations and platform health.'
                : currentUser.role === 'head'
                ? 'Oversee sub-team deliverables, review student engineering submissions, and manage technical workflows.'
                : 'Track your assigned deliverables, submit revision iterations, and coordinate with technical teammates.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {currentUser.role === 'admin' && (
              <GlossyButton
                variant="outline"
                icon={<Shield className="w-4 h-4 text-accent-cyan" />}
                onClick={() => onNavigateTab('admin')}
              >
                Admin Command ({pendingRegistrations.length})
              </GlossyButton>
            )}

            {(currentUser.role === 'admin' || currentUser.role === 'head') && (
              <GlossyButton
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={onCreateTaskClick || (() => onNavigateTab('tasks'))}
              >
                Create Task
              </GlossyButton>
            )}

            <GlossyButton
              variant="secondary"
              icon={<MessageSquare className="w-4 h-4" />}
              onClick={() => onNavigateTab('chat')}
            >
              Pit Wall Chat
            </GlossyButton>
          </div>
        </div>

        {/* ─── ROLE-SPECIFIC TELEMETRY CARDS (Objective 4) ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-cyber-border">
          {/* CARD 1 */}
          {currentUser.role === 'admin' ? (
            <div className="p-3.5 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden group hover:border-accent-cyan/40 transition-colors">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-cyan opacity-70" />
              <div className="text-[11px] font-mono text-cyber-secondary uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-accent-cyan" />
                  Total Tasks
                </span>
                <span className="text-[9px] text-cyber-muted tracking-tighter">ALL</span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-black text-accent-cyan mt-1">
                {tasks.length}
              </div>
              <div className="text-[10px] font-mono text-cyber-muted mt-0.5">5 Sub-Teams Combined</div>
            </div>
          ) : currentUser.role === 'head' ? (
            <div className="p-3.5 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden group hover:border-accent-cyan/40 transition-colors">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-cyan opacity-70" />
              <div className="text-[11px] font-mono text-cyber-secondary uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-accent-cyan" />
                  Team Queue
                </span>
                <span className="text-[9px] text-cyber-muted tracking-tighter">SUB-TEAM</span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-black text-accent-cyan mt-1">
                {tasks.length}
              </div>
              <div className="text-[10px] font-mono text-cyber-muted mt-0.5">Active Deliverables</div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden group hover:border-accent-cyan/40 transition-colors">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-cyan opacity-70" />
              <div className="text-[11px] font-mono text-cyber-secondary uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-accent-cyan" />
                  My Tasks
                </span>
                <span className="text-[9px] text-cyber-muted tracking-tighter">ASSIGNED</span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-black text-accent-cyan mt-1">
                {myTasks.length}
              </div>
              <div className="text-[10px] font-mono text-cyber-muted mt-0.5">Assigned to Me</div>
            </div>
          )}

          {/* CARD 2 */}
          {currentUser.role === 'admin' ? (
            <div
              onClick={() => onNavigateTab('admin')}
              className="p-3.5 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden group hover:border-accent-yellow/40 transition-colors cursor-pointer"
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-yellow opacity-70" />
              <div className="text-[11px] font-mono text-cyber-secondary uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-accent-yellow" />
                  Registrations
                </span>
                <span className="text-[9px] text-accent-yellow tracking-tighter font-bold">ACTION</span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-black text-accent-yellow mt-1">
                {pendingRegistrations.length}
              </div>
              <div className="text-[10px] font-mono text-cyber-muted mt-0.5">Pending Approval</div>
            </div>
          ) : currentUser.role === 'head' ? (
            <div
              onClick={() => onNavigateTab('tasks')}
              className="p-3.5 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden group hover:border-accent-orange/40 transition-colors cursor-pointer"
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-orange opacity-70" />
              <div className="text-[11px] font-mono text-cyber-secondary uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-accent-orange" />
                  Needs Review
                </span>
                <span className="text-[9px] text-accent-orange tracking-tighter font-bold">LEAD</span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-black text-accent-orange mt-1">
                {needsReviewTasks.length}
              </div>
              <div className="text-[10px] font-mono text-cyber-muted mt-0.5">Submissions Awaiting You</div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden group hover:border-accent-red/40 transition-colors">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-red opacity-70" />
              <div className="text-[11px] font-mono text-cyber-secondary uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-accent-red" />
                  Revisions
                </span>
                <span className="text-[9px] text-accent-red tracking-tighter font-bold">FEEDBACK</span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-black text-accent-red mt-1">
                {changesRequestedTasks.length}
              </div>
              <div className="text-[10px] font-mono text-cyber-muted mt-0.5">Changes Requested</div>
            </div>
          )}

          {/* CARD 3 */}
          {currentUser.role === 'member' ? (
            <div className="p-3.5 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden group hover:border-accent-yellow/40 transition-colors">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-yellow opacity-70" />
              <div className="text-[11px] font-mono text-cyber-secondary uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-accent-yellow" />
                  Due Soon
                </span>
                <span className="text-[9px] text-cyber-muted tracking-tighter">&lt;72H</span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-black text-accent-yellow mt-1">
                {dueSoonTasks.length}
              </div>
              <div className="text-[10px] font-mono text-cyber-muted mt-0.5">Upcoming Deadlines</div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden group hover:border-accent-lime/40 transition-colors">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-lime opacity-70" />
              <div className="text-[11px] font-mono text-cyber-secondary uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-lime" />
                  Completed
                </span>
                <span className="text-[9px] text-cyber-muted tracking-tighter">DONE</span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-black text-accent-lime mt-1">
                {tasks.filter((t) => t.status === 'approved' || t.status === 'done').length}
              </div>
              <div className="text-[10px] font-mono text-cyber-muted mt-0.5">Approved Deliverables</div>
            </div>
          )}

          {/* CARD 4 */}
          <div className="p-3.5 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden group hover:border-accent-red/40 transition-colors">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-red opacity-70" />
            <div className="text-[11px] font-mono text-cyber-secondary uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-accent-red" />
                Overdue
              </span>
              <span className="text-[9px] text-accent-red tracking-tighter font-bold">ALERT</span>
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black text-accent-red mt-1">
              {overdueTasks.length}
            </div>
            <div className="text-[10px] font-mono text-cyber-muted mt-0.5">Past Target Deadline</div>
          </div>
        </div>
      </GlassCard>

      {/* ─── ADMIN: 5 SUB-TEAMS TELEMETRY MATRIX ─── */}
      {currentUser.role === 'admin' && (
        <GlassCard className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-cyan" />
              <h3 className="font-display font-bold text-base text-cyber-primary uppercase tracking-wider">
                Sub-Teams Engineering Matrix
              </h3>
            </div>
            <span className="font-mono text-xs text-cyber-muted">5 ACTIVE UNITS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {effectiveGroups.map((group) => {
              const groupTasks = tasks.filter((t) => t.group_id === group.id);
              const groupApproved = groupTasks.filter((t) => t.status === 'approved' || t.status === 'done').length;
              const pct = groupTasks.length > 0 ? Math.round((groupApproved / groupTasks.length) * 100) : 0;
              const groupMembers = allProfiles.filter((p) => p.group_id === group.id && p.status === 'approved');

              return (
                <div
                  key={group.id}
                  className="p-3.5 rounded-xl bg-cyber-surface-elevated border border-cyber-border hover:border-cyber-border-strong transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: group.color_accent || '#00D9FF' }}
                      />
                      <span className="font-bold text-xs text-cyber-primary truncate">
                        {group.name.replace(/Technical - |Operations - /, '')}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-cyber-muted">
                      {groupMembers.length} eng
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-cyber-muted">
                      <span>PROGRESS</span>
                      <span className="text-cyber-primary font-bold">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-cyber-bg-alt overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: group.color_accent || '#00D9FF'
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-cyber-secondary pt-1 border-t border-cyber-border/40">
                    <span>Active: {groupTasks.length}</span>
                    <span>Delivered: {groupApproved}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* ─── GROUP HEAD: DELIVERABLES REQUIRING REVIEW ─── */}
      {currentUser.role === 'head' && needsReviewTasks.length > 0 && (
        <GlassCard className="p-5 sm:p-6 space-y-3.5 border-accent-orange/40">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-accent-orange" />
              <h3 className="font-display font-bold text-base text-cyber-primary uppercase tracking-wider">
                Awaiting Lead Review ({needsReviewTasks.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-accent-orange uppercase px-2 py-0.5 rounded bg-accent-orange/10 border border-accent-orange/30">
              ACTION REQUIRED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {needsReviewTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onNavigateTab('tasks')}
                className="p-3.5 rounded-xl bg-cyber-surface-elevated border border-accent-orange/30 hover:border-accent-orange transition-all space-y-2 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-accent-orange/10 text-accent-orange font-bold">
                    SUBMITTED FOR REVIEW
                  </span>
                  <span className="font-mono text-[10px] text-cyber-muted">
                    {new Date(t.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-sans font-bold text-xs sm:text-sm text-cyber-primary group-hover:text-accent-orange transition-colors truncate">
                  {t.title}
                </h4>
                <div className="text-[11px] font-mono text-cyber-secondary flex items-center justify-between pt-1 border-t border-cyber-border">
                  <span>Assignees: {t.assignees?.map(a => a.full_name).join(', ') || 'Unassigned'}</span>
                  <span className="text-accent-cyan flex items-center gap-0.5">
                    REVIEW <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ─── DELIVERABLES STREAM (MY WORK VS TEAM FEED) ─── */}
      <GlassCard className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-cyber-border">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent-cyan" />
            <h3 className="font-display font-bold text-sm sm:text-base text-cyber-primary uppercase tracking-wider">
              {currentUser.role === 'member'
                ? memberView === 'my_work' ? 'My Assigned Deliverables' : 'Sub-Team Telemetry Stream'
                : 'Recent Deliverables Telemetry'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {currentUser.role === 'member' && (
              <div className="flex items-center p-0.5 rounded-lg bg-cyber-bg-alt border border-cyber-border text-[11px] font-mono">
                <button
                  onClick={() => setMemberView('my_work')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    memberView === 'my_work'
                      ? 'bg-accent-cyan text-black font-bold'
                      : 'text-cyber-muted hover:text-cyber-primary'
                  }`}
                >
                  My Work ({myTasks.length})
                </button>
                <button
                  onClick={() => setMemberView('team_feed')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    memberView === 'team_feed'
                      ? 'bg-accent-cyan text-black font-bold'
                      : 'text-cyber-muted hover:text-cyber-primary'
                  }`}
                >
                  Team All ({tasks.length})
                </button>
              </div>
            )}

            <GhostButton size="sm" onClick={() => onNavigateTab('tasks')}>
              <span>VIEW ALL ({tasks.length})</span>
              <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" />
            </GhostButton>
          </div>
        </div>

        {displayTasks.length === 0 ? (
          <EmptyState
            illustration="telemetry"
            title={memberView === 'my_work' ? 'NO PERSONAL ASSIGNMENTS' : 'NO ACTIVE DELIVERABLES'}
            description={memberView === 'my_work' 
              ? 'You currently have no tasks assigned to you. Browse team tasks or request a dispatch from your Lead.' 
              : 'All deliverables for this sub-team scope are currently clear.'}
            actionLabel={currentUser.role === 'admin' || currentUser.role === 'head' ? 'CREATE FIRST DELIVERABLE' : undefined}
            onAction={onCreateTaskClick || (() => onNavigateTab('tasks'))}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayTasks.map((t) => {
              const deadlineInfo = getDeadlineDisplay(t.deadline);
              const isMine = t.assignees?.some(a => a.id === currentUser.id);

              return (
                <div
                  key={t.id}
                  onClick={() => onNavigateTab('tasks')}
                  className={`p-3.5 rounded-lg bg-cyber-bg-alt border transition-all space-y-2.5 cursor-pointer group shadow-cyber-sm ${
                    t.status === 'changes_requested'
                      ? 'border-accent-red/50 hover:border-accent-red'
                      : deadlineInfo.isOverdue
                      ? 'border-accent-red/40 hover:border-accent-red'
                      : 'border-cyber-border hover:border-accent-cyan/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-cyber-muted">
                          {t.task_type} // {t.priority}
                        </span>
                        {isMine && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan">
                            ASSIGNED TO YOU
                          </span>
                        )}
                      </div>
                      <h4 className="font-sans font-bold text-xs sm:text-sm text-cyber-primary group-hover:text-accent-cyan transition-colors leading-snug truncate">
                        {t.title}
                      </h4>
                    </div>
                    <LedStatusChip status={t.status} size="sm" />
                  </div>

                  {t.description && (
                    <p className="text-xs text-cyber-secondary line-clamp-1 leading-relaxed">
                      {t.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-cyber-border text-[11px] font-mono">
                    <span className={deadlineInfo.isOverdue ? 'text-accent-red font-bold' : 'text-cyber-muted'}>
                      {deadlineInfo.text}
                    </span>
                    <span className="text-accent-cyan group-hover:translate-x-0.5 transition-transform flex items-center">
                      OPEN <ChevronRight className="w-3 h-3 ml-0.5 inline" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
