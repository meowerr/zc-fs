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
import { PageHeader } from '../common/PageHeader';
import { StatStrip } from '../common/StatStrip';
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

  // Role-specific telemetry stat tiles
  const statTiles = useMemo(() => {
    if (currentUser.role === 'admin') {
      return [
        { label: 'Total Tasks', tag: 'ALL', icon: Sliders, color: 'text-accent-cyan', bar: 'bg-accent-cyan', count: tasks.length, sub: '5 Sub-Teams Combined', zero: 'No active deliverables' },
        { label: 'Registrations', tag: 'ACTION', icon: Users, color: 'text-accent-yellow', bar: 'bg-accent-yellow', count: pendingRegistrations.length, sub: 'Pending Approval', zero: 'All caught up', action: () => onNavigateTab('admin') },
        { label: 'Completed', tag: 'DONE', icon: CheckCircle2, color: 'text-accent-lime', bar: 'bg-accent-lime', count: tasks.filter(t => t.status === 'approved' || t.status === 'done').length, sub: 'Approved Deliverables', zero: 'No approved tasks yet' },
        { label: 'Overdue', tag: 'ALERT', icon: AlertTriangle, color: 'text-accent-red', bar: 'bg-accent-red', count: overdueTasks.length, sub: 'Past Target Deadline', zero: 'On schedule' },
      ];
    }
    if (currentUser.role === 'head') {
      return [
        { label: 'Team Queue', tag: 'SUB-TEAM', icon: Sliders, color: 'text-accent-cyan', bar: 'bg-accent-cyan', count: tasks.length, sub: 'Active Deliverables', zero: 'No queue deliverables' },
        { label: 'Needs Review', tag: 'LEAD', icon: FileCheck, color: 'text-purple-400', bar: 'bg-purple-500', count: needsReviewTasks.length, sub: 'Submissions Awaiting You', zero: 'No reviews pending', action: () => onNavigateTab('tasks') },
        { label: 'Completed', tag: 'DONE', icon: CheckCircle2, color: 'text-accent-lime', bar: 'bg-accent-lime', count: tasks.filter(t => t.status === 'approved' || t.status === 'done').length, sub: 'Approved Deliverables', zero: 'No approved tasks yet' },
        { label: 'Overdue', tag: 'ALERT', icon: AlertTriangle, color: 'text-accent-red', bar: 'bg-accent-red', count: overdueTasks.length, sub: 'Past Target Deadline', zero: 'On schedule' },
      ];
    }
    return [
      { label: 'My Tasks', tag: 'ASSIGNED', icon: Activity, color: 'text-accent-cyan', bar: 'bg-accent-cyan', count: myTasks.length, sub: 'Assigned to Me', zero: 'No tasks assigned' },
      { label: 'Revisions', tag: 'FEEDBACK', icon: AlertTriangle, color: 'text-accent-red', bar: 'bg-accent-red', count: changesRequestedTasks.length, sub: 'Changes Requested', zero: 'No changes requested' },
      { label: 'Due Soon', tag: '<72H', icon: Clock, color: 'text-accent-yellow', bar: 'bg-accent-yellow', count: dueSoonTasks.length, sub: 'Upcoming Deadlines', zero: 'No upcoming deadlines' },
      { label: 'Overdue', tag: 'ALERT', icon: AlertTriangle, color: 'text-accent-red', bar: 'bg-accent-red', count: overdueTasks.length, sub: 'Past Target Deadline', zero: 'On schedule' },
    ];
  }, [currentUser.role, tasks, pendingRegistrations.length, overdueTasks.length, needsReviewTasks.length, myTasks.length, changesRequestedTasks.length, dueSoonTasks.length, onNavigateTab]);

  // Recent tasks to show on main feed
  const displayTasks = useMemo(() => {
    if (currentUser.role === 'member' && memberView === 'my_work') {
      return myTasks.slice(0, 6);
    }
    return tasks.slice(0, 6);
  }, [currentUser.role, memberView, myTasks, tasks]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ─── UNASSIGNED MEMBER ALERT BANNER ─── */}
      {currentUser.role !== 'admin' && !currentUser.group_id && currentUser.status === 'approved' && (
        <div className="p-4 rounded-xl bg-accent-yellow/10 border border-accent-yellow/30 text-cyber-primary flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent-yellow shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-medium text-xs uppercase font-mono text-accent-yellow">
              Awaiting Sub-Team Assignment
            </h4>
            <p className="text-xs text-cyber-secondary font-sans leading-relaxed">
              Your account has been verified by Club Administration. You are currently in the general engineer pool. An administrator will assign you to an engineering sub-team shortly. In the meantime, you can participate in `#announcements` or review the Team Directory.
            </p>
          </div>
        </div>
      )}

      {/* ─── UNIFIED HERO TELEMETRY BANNER ─── */}
      <PageHeader
        title={
          currentUser.role === 'admin' 
            ? 'Club Telemetry Command' 
            : currentUser.role === 'head'
            ? `${userTeam?.name?.replace(/Technical - |Operations - /, '') || 'Sub-Team'} Leadership`
            : 'My Engineering Workspace'
        }
        eyebrow={
          currentUser.role === 'admin' 
            ? 'Club Race Control HQ' 
            : currentUser.role === 'head'
            ? `Sub-Team Lead • ${userTeam?.name?.replace(/Technical - |Operations - /, '') || 'Pit Wall'}`
            : `Engineering Cockpit • ${userTeam?.name?.replace(/Technical - |Operations - /, '') || 'Workspace'}`
        }
        description={
          currentUser.role === 'admin'
            ? 'High-level telemetry across all 5 technical and operational sub-teams. Govern registrations and platform health.'
            : currentUser.role === 'head'
            ? 'Oversee sub-team deliverables, review student engineering submissions, and manage technical workflows.'
            : 'Track your assigned deliverables, submit revision iterations, and coordinate with technical teammates.'
        }
        actions={
          <>
            {currentUser.role === 'admin' && (
              <GlossyButton
                variant="outline"
                size="sm"
                icon={<Shield className="w-4 h-4 text-accent-cyan" />}
                onClick={() => onNavigateTab('admin')}
              >
                Admin Command ({pendingRegistrations.length})
              </GlossyButton>
            )}
            {(currentUser.role === 'admin' || currentUser.role === 'head') && (
              <GlossyButton
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={onCreateTaskClick || (() => onNavigateTab('tasks'))}
              >
                Create Task
              </GlossyButton>
            )}
            <GlossyButton
              variant="secondary"
              size="sm"
              icon={<MessageSquare className="w-4 h-4" />}
              onClick={() => onNavigateTab('chat')}
            >
              Pit Wall Chat
            </GlossyButton>
          </>
        }
        stats={
          <StatStrip
            items={statTiles.map((tile) => ({
              label: tile.label,
              value: tile.count,
              tone: tile.color.includes('cyan')
                ? 'cyan'
                : tile.color.includes('yellow')
                ? 'yellow'
                : tile.color.includes('lime')
                ? 'lime'
                : 'red',
            }))}
          />
        }
      />

      {/* ─── ADMIN: 5 SUB-TEAMS TELEMETRY MATRIX ─── */}
      {currentUser.role === 'admin' && (
        <GlassCard variant="flat" className="space-y-4">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-cyan" />
              <h3 className="text-label font-sans font-semibold text-cyber-secondary md:font-display md:font-bold md:text-base md:text-cyber-primary md:uppercase md:tracking-wider">
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
                      <span className="font-sans font-semibold text-sm text-cyber-primary truncate">
                        {group.name.replace(/Technical - |Operations - /, '')}
                      </span>
                    </div>
                    <span className="font-mono text-label text-cyber-muted">
                      {groupMembers.length} eng
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-label font-mono text-cyber-muted">
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

                  <div className="flex justify-between text-label font-mono text-cyber-secondary pt-1 border-t border-cyber-border/40">
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
        <GlassCard variant="flat" className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-purple-400" />
              <h3 className="text-label font-sans font-semibold text-cyber-secondary md:font-display md:font-bold md:text-base md:text-cyber-primary md:uppercase md:tracking-wider">
                Awaiting Lead Review ({needsReviewTasks.length})
              </h3>
            </div>
            <span className="text-label font-mono text-purple-400 uppercase px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">
              ACTION REQUIRED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {needsReviewTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onNavigateTab('tasks')}
                className="p-3.5 rounded-xl bg-cyber-surface-elevated border border-purple-500/30 hover:border-purple-400 transition-all space-y-2 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-label uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">
                    SUBMITTED FOR REVIEW
                  </span>
                  <span className="font-mono text-label text-cyber-muted">
                    {new Date(t.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-sans font-semibold text-base text-cyber-primary group-hover:text-purple-400 transition-colors truncate">
                  {t.title}
                </h4>
                <div className="text-label font-mono text-cyber-secondary flex items-center justify-between pt-1 border-t border-cyber-border">
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
      <GlassCard variant="flat" className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-cyber-border">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-label font-sans font-semibold text-cyber-secondary md:font-display md:font-bold md:text-sm md:sm:text-base md:text-cyber-primary md:uppercase md:tracking-wider">
              {currentUser.role === 'member'
                ? memberView === 'my_work' ? 'My Assigned Deliverables' : 'Sub-Team Telemetry Stream'
                : 'Recent Deliverables Telemetry'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {currentUser.role === 'member' && (
              <div className="flex items-center p-0.5 rounded-lg bg-cyber-bg-alt border border-cyber-border text-label font-mono">
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
                        <span className="font-mono text-label uppercase tracking-wider text-cyber-muted">
                          {t.task_type} // {t.priority}
                        </span>
                        {isMine && (
                          <span className="text-label font-mono px-1.5 py-0.5 rounded bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan">
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

                  <div className="flex items-center justify-between pt-2 border-t border-cyber-border text-label font-mono">
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
