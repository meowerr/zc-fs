import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Download,
  FileSpreadsheet,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
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
    <div className="space-y-5">
      {/* Top Telemetry Header & Stats */}
      <GlassCard variant="elevated" className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-cyber-bg-alt border border-cyber-border text-xs font-mono">
              <span className="text-accent-cyan font-bold">//</span>
              <span className="text-cyber-secondary uppercase tracking-widest text-[11px]">DELIVERABLES // TELEMETRY</span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-cyber-primary uppercase tracking-wider">
              {currentUser.role === 'admin'
                ? 'Club Task Telemetry'
                : `${currentUser.role === 'head' ? 'Pit Wall' : 'My Deliverables'} Workspace`}
            </h2>
            <p className="text-xs text-cyber-secondary max-w-lg leading-relaxed">
              Track engineering milestones, submit CAD/code/specs, and review deliverables with multi-version history.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-5 pt-4 border-t border-cyber-border">
          <div className="p-3 rounded-lg bg-cyber-bg-alt border border-cyber-border">
            <div className="text-[10px] font-mono text-cyber-muted uppercase flex items-center justify-between">
              <span>Total Work</span>
              <FileCheck className="w-3 h-3 text-cyber-muted" />
            </div>
            <div className="text-xl sm:text-2xl font-display font-black text-cyber-primary mt-0.5">{tasks.length}</div>
            <div className="text-[9px] font-mono text-cyber-muted">All Deliverables</div>
          </div>

          <div className="p-3 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-yellow" />
            <div className="text-[10px] font-mono text-cyber-muted uppercase flex items-center justify-between">
              <span>In Review</span>
              <Clock className="w-3 h-3 text-accent-yellow" />
            </div>
            <div className="text-xl sm:text-2xl font-display font-black text-accent-yellow mt-0.5">{inReviewCount}</div>
            <div className="text-[9px] font-mono text-cyber-muted">Awaiting Head Review</div>
          </div>

          <div className="p-3 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-red" />
            <div className="text-[10px] font-mono text-cyber-muted uppercase flex items-center justify-between">
              <span>Critical Overdue</span>
              <AlertTriangle className="w-3 h-3 text-accent-red" />
            </div>
            <div className="text-xl sm:text-2xl font-display font-black text-accent-red mt-0.5">{overdueCount}</div>
            <div className="text-[9px] font-mono text-cyber-muted">Requires Immediate Action</div>
          </div>

          <div className="p-3 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-lime" />
            <div className="text-[10px] font-mono text-cyber-muted uppercase flex items-center justify-between">
              <span>Verified / Passed</span>
              <CheckCircle2 className="w-3 h-3 text-accent-lime" />
            </div>
            <div className="text-xl sm:text-2xl font-display font-black text-accent-lime mt-0.5">{completedCount}</div>
            <div className="text-[9px] font-mono text-cyber-muted">Deliverables Approved</div>
          </div>
        </div>
      </GlassCard>

      {/* Filter & Search Bar */}
      <GlassCard className="p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-cyber-muted" />
            <input
              type="text"
              placeholder="Search deliverables by title, note, or engineer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3.5 rounded-lg text-xs font-sans bg-cyber-surface-elevated border border-cyber-border text-cyber-primary placeholder:text-cyber-muted focus:outline-none focus:border-accent-cyan"
            />
          </div>

          {/* Group Filter for Admin */}
          {currentUser.role === 'admin' && (
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="h-9 px-3 rounded-lg text-xs font-mono bg-cyber-surface-elevated border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
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
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-cyber-border">
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
                px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase transition-all cursor-pointer border
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
