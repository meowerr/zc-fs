import React from 'react';
import { Clock, ChevronRight, Plus, MessageSquare, Activity, CheckCircle2, AlertTriangle, Flag } from 'lucide-react';
import { GlossyButton } from '../common/GlossyButton';
import { LedStatusChip } from '../common/LedStatusChip';
import { EmptyState } from '../common/EmptyState';
import { PageHeader, StatTile } from '../common/PageHeader';
import { formatDeadline } from '../tasks/TaskCard';
import { Profile, Task } from '../../lib/database.types';
import { NavTab } from '../layout/navConfig';

interface MissionControlProps {
  currentUser: Profile;
  tasks: Task[];
  onNavigateTab: (tab: NavTab) => void;
  onCreateTaskClick?: () => void;
  onOpenTask?: (taskId: string) => void;
}

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const isOpen = (t: Task) => t.status !== 'done' && t.status !== 'approved';

interface TaskRowProps {
  task: Task;
  onOpen: () => void;
  reason?: string;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, onOpen, reason }) => {
  const deadline = new Date(task.deadline);
  const overdue = isOpen(task) && deadline < new Date();
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group w-full flex items-center gap-3 p-3 sm:px-4 text-left rounded-lg hover:bg-cyber-surface-hover transition-colors duration-fast cursor-pointer"
      >
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-cyber-primary truncate group-hover:text-accent-cyan transition-colors duration-fast">
            {task.title}
          </span>
          <span className="flex items-center gap-2 mt-0.5 text-xs text-cyber-muted">
            {reason && <span className="text-cyber-secondary">{reason}</span>}
            {reason && <span aria-hidden="true">·</span>}
            <span className={overdue ? 'text-accent-red font-medium' : ''}>
              {isOpen(task) ? formatDeadline(deadline) : deadline.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </span>
        </span>
        <LedStatusChip status={task.status} size="sm" />
        <ChevronRight className="hidden sm:block w-4 h-4 text-cyber-muted group-hover:text-accent-cyan shrink-0" aria-hidden="true" />
      </button>
    </li>
  );
};

export const MissionControl: React.FC<MissionControlProps> = ({
  currentUser,
  tasks,
  onNavigateTab,
  onCreateTaskClick,
  onOpenTask,
}) => {
  const isReviewer = currentUser.role === 'admin' || currentUser.role === 'head';
  const now = new Date();

  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const reviewCount = tasks.filter((t) => t.status === 'submitted').length;
  const approvedCount = tasks.filter((t) => t.status === 'approved' || t.status === 'done').length;
  const overdueCount = tasks.filter((t) => isOpen(t) && new Date(t.deadline) < now).length;

  const mine = tasks.filter((t) => t.assignees?.some((a) => a.id === currentUser.id));
  const attention = (
    isReviewer
      ? tasks
          .filter((t) => t.status === 'submitted' || (isOpen(t) && new Date(t.deadline) < now))
          .map((t) => ({ task: t, reason: t.status === 'submitted' ? 'Ready for review' : 'Overdue' }))
      : mine
          .filter((t) => t.status === 'changes_requested' || (isOpen(t) && new Date(t.deadline).getTime() - now.getTime() < 1000 * 60 * 60 * 72))
          .map((t) => ({ task: t, reason: t.status === 'changes_requested' ? 'Changes requested' : 'Due soon' }))
  )
    .sort((a, b) => new Date(a.task.deadline).getTime() - new Date(b.task.deadline).getTime())
    .slice(0, 5);

  const recent = [...tasks]
    .sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime())
    .slice(0, 6);

  const openTask = (id: string) => (onOpenTask ? onOpenTask(id) : onNavigateTab('tasks'));
  const firstName = currentUser.full_name.split(' ')[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={currentUser.role === 'admin' ? 'Race control' : currentUser.role === 'head' ? 'Pit wall' : 'Your garage'}
        title={`${greeting()}, ${firstName}`}
        description={
          attention.length > 0
            ? `You have ${attention.length} ${attention.length === 1 ? 'item' : 'items'} that need attention.`
            : 'Everything is on track. Nice driving.'
        }
        actions={
          <>
            <GlossyButton variant="secondary" icon={<MessageSquare className="w-4 h-4" />} onClick={() => onNavigateTab('chat')}>
              Pit Wall
            </GlossyButton>
            {isReviewer && (
              <GlossyButton variant="primary" icon={<Plus className="w-4 h-4" />} onClick={onCreateTaskClick}>
                New task
              </GlossyButton>
            )}
          </>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <StatTile label="In progress" value={inProgressCount} hint="Active work" tone="orange" icon={<Activity className="w-4 h-4" />} onClick={() => onNavigateTab('tasks')} />
          <StatTile label="In review" value={reviewCount} hint="Submissions queued" tone="yellow" icon={<Clock className="w-4 h-4" />} onClick={() => onNavigateTab('tasks')} />
          <StatTile label="Overdue" value={overdueCount} hint="Past deadline" tone="red" icon={<AlertTriangle className="w-4 h-4" />} onClick={() => onNavigateTab('tasks')} />
          <StatTile label="Approved" value={approvedCount} hint="Verified deliverables" tone="lime" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => onNavigateTab('tasks')} />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
        <section aria-labelledby="attention-title" className="lg:col-span-2 rounded-xl bg-cyber-surface border border-cyber-border">
          <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-cyber-border">
            <Flag className="w-4 h-4 text-accent-orange" aria-hidden="true" />
            <h2 id="attention-title" className="font-display font-bold text-sm text-cyber-primary tracking-wide">
              {isReviewer ? 'Needs your review' : 'Up next for you'}
            </h2>
          </div>
          {attention.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto text-accent-lime" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-cyber-primary">All clear</p>
              <p className="text-xs text-cyber-muted mt-0.5">
                {isReviewer ? 'No submissions waiting and nothing overdue.' : 'Nothing due in the next 3 days.'}
              </p>
            </div>
          ) : (
            <ul className="p-1.5 divide-y divide-cyber-border">
              {attention.map(({ task, reason }) => (
                <TaskRow key={task.id} task={task} reason={reason} onOpen={() => openTask(task.id)} />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-title" className="lg:col-span-3 rounded-xl bg-cyber-surface border border-cyber-border">
          <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3 border-b border-cyber-border">
            <h2 id="recent-title" className="font-display font-bold text-sm text-cyber-primary tracking-wide">
              Recent activity
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('tasks')}
              className="h-8 px-2 -mr-2 rounded-md inline-flex items-center gap-1 text-xs font-semibold text-accent-cyan hover:bg-accent-cyan/10 transition-colors duration-fast cursor-pointer"
            >
              View all {tasks.length > 0 && <span className="tabular-nums">({tasks.length})</span>}
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="p-3">
              <EmptyState
                title="No tasks yet"
                description={
                  isReviewer
                    ? 'Dispatch the first deliverable to your sub-team to get the season moving.'
                    : 'Your group head hasn’t assigned any deliverables yet.'
                }
                actionLabel={isReviewer ? 'Create a task' : undefined}
                onAction={onCreateTaskClick}
                className="border-0 bg-transparent"
              />
            </div>
          ) : (
            <ul className="p-1.5 divide-y divide-cyber-border">
              {recent.map((task) => (
                <TaskRow key={task.id} task={task} reason={task.task_type.charAt(0).toUpperCase() + task.task_type.slice(1)} onOpen={() => openTask(task.id)} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
