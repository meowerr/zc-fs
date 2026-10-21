import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { PageHeader } from '../common/PageHeader';
import { StatStrip } from '../common/StatStrip';
import { GlossyButton } from '../common/GlossyButton';
import { GhostButton } from '../common/GhostButton';
import { EmptyState } from '../common/EmptyState';
import { TaskCard } from './TaskCard';
import { TaskCreateModal } from './TaskCreateModal';
import { TaskDetailModal } from './TaskDetailModal';
import { SUB_TEAMS } from '../../lib/constants';
import { exportTasksToCSV, exportTasksToJSON } from '../../lib/exportUtils';
import { 
  Task, 
  TaskStatus, 
  SubmissionType, 
  SubmissionReviewStatus, 
  Profile, 
  TaskType, 
  TaskPriority,
  Group
} from '../../lib/database.types';

interface TasksHubProps {
  currentUser: Profile;
  tasks: Task[];
  teamMembers: Profile[];
  submissions: Record<string, any>;
  comments: Record<string, any>;
  groups?: Group[];
  onCreateTask: (taskData: {
    title: string;
    description: string;
    groupId: string;
    taskType: TaskType;
    priority: TaskPriority;
    deadline: string;
    links: Array<{ title: string; url: string }>;
    assigneeIds: string[];
    assignees: Profile[];
  }) => Promise<void>;
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onSubmitWork: (taskId: string, type: SubmissionType, content: string, notes: string) => Promise<void>;
  onReviewSubmission: (submissionId: string, taskId: string, status: SubmissionReviewStatus, feedback: string) => Promise<void>;
  onAddComment: (taskId: string, content: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  initialTaskId?: string | null;
  onClearInitialTaskId?: () => void;
}

export const TasksHub: React.FC<TasksHubProps> = ({
  currentUser,
  tasks,
  teamMembers,
  submissions,
  comments,
  groups,
  onCreateTask,
  onUpdateStatus,
  onSubmitWork,
  onReviewSubmission,
  onAddComment,
  onDeleteTask,
  initialTaskId,
  onClearInitialTaskId,
}) => {
  const [filter, setFilter] = useState<'all' | 'my_tasks' | 'submitted' | 'in_progress' | 'approved' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  // Sync initialTaskId if passed from Search or Notifications
  React.useEffect(() => {
    if (initialTaskId) {
      const found = tasks.find((t) => t.id === initialTaskId);
      if (found) {
        setSelectedTask(found);
      }
    }
  }, [initialTaskId, tasks]);

  const isHeadOrAdmin = currentUser.role === 'admin' || currentUser.role === 'head';
  const now = new Date();
  const effectiveGroups = (groups && groups.length > 0) ? groups : SUB_TEAMS;

  // Filter tasks based on criteria
  const filteredTasks = tasks.filter((t) => {
    // Group filter (for admin)
    if (currentUser.role === 'admin' && selectedGroupFilter !== 'all' && t.group_id !== selectedGroupFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchAssignee = t.assignees?.some((a) => a.full_name.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }

    // Tab filter
    const isOverdue = new Date(t.deadline) < now && t.status !== 'done' && t.status !== 'approved';
    if (filter === 'my_tasks') {
      return t.assignees?.some((a) => a.id === currentUser.id);
    }
    if (filter === 'overdue') {
      return isOverdue;
    }
    if (filter === 'submitted') {
      return t.status === 'submitted';
    }
    if (filter === 'in_progress') {
      return t.status === 'in_progress';
    }
    if (filter === 'approved') {
      return t.status === 'approved' || t.status === 'done';
    }

    return true;
  });

  // Calculate telemetry counts
  const overdueCount = tasks.filter((t) => new Date(t.deadline) < now && t.status !== 'done' && t.status !== 'approved').length;
  const inReviewCount = tasks.filter((t) => t.status === 'submitted').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'approved' || t.status === 'done').length;

  return (
    <div className="space-y-5 pb-[calc(9rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Unified Telemetry Header & Stats */}
      <PageHeader
        title={
          currentUser.role === 'admin'
            ? 'Club Task Telemetry'
            : `${currentUser.role === 'head' ? 'Pit Wall' : 'Deliverables'}`
        }
        eyebrow="Deliverables // Telemetry"
        description="Track engineering milestones, submit CAD/code/specs, and review deliverables with multi-version history."
        actions={
          <>
            <GhostButton
              size="sm"
              icon={<FileSpreadsheet className="w-3.5 h-3.5 text-accent-cyan" />}
              onClick={() => exportTasksToCSV(tasks, effectiveGroups)}
              title="Download tasks as CSV spreadsheet"
            >
              CSV Export
            </GhostButton>
            <GhostButton
              size="sm"
              icon={<Download className="w-3.5 h-3.5 text-cyber-chrome" />}
              onClick={() => exportTasksToJSON(tasks)}
              title="Download JSON telemetry dump"
            >
              JSON
            </GhostButton>
            {isHeadOrAdmin && (
              <GlossyButton
                variant="primary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Task
              </GlossyButton>
            )}
          </>
        }
        stats={
          <StatStrip
            items={[
              { label: 'Total Tasks', value: tasks.length },
              { label: 'In Review', value: inReviewCount, tone: 'yellow', hideZeroOnMobile: true },
              { label: 'Critical Overdue', value: overdueCount, tone: 'red', hideZeroOnMobile: true },
              { label: 'Deliverables Approved', value: completedCount, tone: 'lime', hideZeroOnMobile: true },
            ]}
          />
        }
      />

      {/* Filter & Search Bar */}
      <GlassCard variant="flat" className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-cyber-muted" />
            <input
              type="text"
              placeholder="Search deliverables by title, note, or engineer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] sm:min-h-0 sm:h-9 pl-9 pr-3.5 rounded-lg text-base sm:text-xs font-sans bg-cyber-surface-elevated border border-cyber-border text-cyber-primary placeholder:text-cyber-muted focus:outline-none focus:border-accent-cyan"
            />
          </div>

          {/* Group Filter for Admin */}
          {currentUser.role === 'admin' && (
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="h-10 sm:h-9 min-h-[44px] sm:min-h-0 px-3 rounded-lg text-base sm:text-xs font-mono bg-cyber-surface-elevated border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
            >
              <option value="all">ALL SUB-TEAMS ({effectiveGroups.length})</option>
              {effectiveGroups.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Filter Pills */}
        <div className="-mx-3.5 px-3.5 flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none pt-2 border-t border-cyber-border mask-fade-edges">
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'my_tasks', label: 'My Deliverables' },
            { id: 'submitted', label: `In Review (${inReviewCount})` },
            { id: 'in_progress', label: `In Progress (${inProgressCount})` },
            { id: 'overdue', label: `Overdue (${overdueCount})` },
            { id: 'approved', label: 'Approved' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilter(pill.id as any)}
              className={`
                shrink-0 snap-start min-h-[44px] px-4 rounded-lg text-label font-mono font-medium uppercase transition-all cursor-pointer border
                ${
                  filter === pill.id
                    ? 'bg-accent-cyan text-black border-accent-cyan shadow-[0_0_8px_rgba(0,217,255,0.3)]'
                    : 'bg-cyber-surface-elevated text-cyber-secondary border-cyber-border hover:border-cyber-border-strong hover:text-cyber-primary'
                }
              `}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Deliverables Grid */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          illustration="wheel"
          title="NO DELIVERABLES MATCH"
          description={
            searchQuery
              ? 'No deliverables match your search criteria. Try a different keyword.'
              : 'No tasks currently exist in this filter view.'
          }
          actionLabel={isHeadOrAdmin ? '+ CREATE SUB-TEAM TASK' : undefined}
          onAction={isHeadOrAdmin ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTasks.map((task) => {
            const group = effectiveGroups.find((g) => g.id === task.group_id);
            return (
              <TaskCard
                key={task.id}
                task={task}
                groupName={group ? group.name.replace(/^Technical - |^Operations - /, '') : undefined}
                groupAccent={group?.color_accent}
                onSelect={(t) => setSelectedTask(t)}
              />
            );
          })}
        </div>
      )}

      {/* Floating Action Button (FAB) for Mobile Tasks Creation */}
      {isHeadOrAdmin && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="md:hidden fixed right-4 z-30 w-14 h-14 rounded-2xl bg-accent-cyan text-black shadow-glow-cyan bottom-[calc(5rem+env(safe-area-inset-bottom))] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          aria-label="New task"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Task Creation Modal */}
      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUserGroup={currentUser.group_id}
        isAdmin={currentUser.role === 'admin'}
        teamMembers={teamMembers}
        onCreateTask={onCreateTask}
      />

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={Boolean(selectedTask)}
          onClose={() => {
            setSelectedTask(null);
            onClearInitialTaskId?.();
          }}
          currentUser={currentUser}
          submissions={submissions[selectedTask.id] || []}
          comments={comments[selectedTask.id] || []}
          onUpdateStatus={async (taskId, status) => {
            await onUpdateStatus(taskId, status);
            setSelectedTask((prev) => (prev ? { ...prev, status } : null));
          }}
          onSubmitWork={onSubmitWork}
          onReviewSubmission={onReviewSubmission}
          onAddComment={onAddComment}
          onDeleteTask={onDeleteTask}
        />
      )}
    </div>
  );
};
