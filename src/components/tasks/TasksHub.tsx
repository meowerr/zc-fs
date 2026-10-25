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
import { PageHeader, StatTile } from '../common/PageHeader';
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
  initialCreateOpen?: boolean;
  initialTaskId?: string;
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
  initialCreateOpen = false,
  initialTaskId,
}) => {
  const [filter, setFilter] = useState<'all' | 'my_tasks' | 'submitted' | 'in_progress' | 'approved' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(
    () => (initialTaskId ? tasks.find((t) => t.id === initialTaskId) ?? null : null)
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialCreateOpen);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

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
  const myTasksCount = tasks.filter((t) => t.assignees?.some((a) => a.id === currentUser.id)).length;

  type FilterId = typeof filter;
  const filterPills: Array<{ id: FilterId; label: string; count?: number }> = [
    { id: 'all', label: 'All', count: tasks.length },
    { id: 'my_tasks', label: 'Assigned to me', count: myTasksCount },
    { id: 'submitted', label: 'In review', count: inReviewCount },
    { id: 'in_progress', label: 'In progress', count: inProgressCount },
    { id: 'overdue', label: 'Overdue', count: overdueCount },
    { id: 'approved', label: 'Approved', count: completedCount },
  ];
  const hasActiveFilters = filter !== 'all' || searchQuery.trim() !== '' || selectedGroupFilter !== 'all';
  const clearFilters = () => {
    setFilter('all');
    setSearchQuery('');
    setSelectedGroupFilter('all');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={currentUser.role === 'admin' ? 'All sub-teams' : currentUser.role === 'head' ? 'Your sub-team' : 'Your work'}
        title={currentUser.role === 'member' ? 'My deliverables' : 'Tasks & reviews'}
        description="Track engineering milestones, submit CAD, code and reports, and review each version before it ships."
        actions={
          <>
            <GhostButton
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4" />}
              onClick={() => exportTasksToCSV(tasks, effectiveGroups)}
              title="Download all tasks as a CSV spreadsheet"
            >
              CSV
            </GhostButton>
            <GhostButton
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={() => exportTasksToJSON(tasks)}
              title="Download all tasks as JSON"
            >
              JSON
            </GhostButton>
            {isHeadOrAdmin && (
              <GlossyButton variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateModalOpen(true)}>
                New task
              </GlossyButton>
            )}
          </>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <StatTile label="Total" value={tasks.length} hint="All deliverables" icon={<FileCheck className="w-4 h-4" />} onClick={() => setFilter('all')} active={filter === 'all'} />
          <StatTile label="In review" value={inReviewCount} hint={isHeadOrAdmin ? 'Waiting on you' : 'Waiting on a head'} tone="yellow" icon={<Clock className="w-4 h-4" />} onClick={() => setFilter('submitted')} active={filter === 'submitted'} />
          <StatTile label="Overdue" value={overdueCount} hint="Past deadline" tone="red" icon={<AlertTriangle className="w-4 h-4" />} onClick={() => setFilter('overdue')} active={filter === 'overdue'} />
          <StatTile label="Approved" value={completedCount} hint="Verified & done" tone="lime" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setFilter('approved')} active={filter === 'approved'} />
        </div>
      </PageHeader>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <label htmlFor="task-search" className="sr-only">Search tasks</label>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted pointer-events-none" aria-hidden="true" />
            <input
              id="task-search"
              type="search"
              placeholder="Search by title, description or assignee"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-3.5 rounded-lg text-sm"
            />
          </div>

          {currentUser.role === 'admin' && (
            <div className="sm:w-64">
              <label htmlFor="task-group-filter" className="sr-only">Filter by sub-team</label>
              <select
                id="task-group-filter"
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="w-full h-11 px-3 rounded-lg text-sm cursor-pointer"
              >
                <option value="all">All sub-teams</option>
                {effectiveGroups.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name.replace(/^Technical - |^Operations - /, '')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div role="group" aria-label="Filter by status" className="flex-1 flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
            {filterPills.map((pill) => {
              const isActive = filter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setFilter(pill.id)}
                  aria-pressed={isActive}
                  className={`
                    h-9 px-3 shrink-0 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5
                    transition-colors duration-fast cursor-pointer
                    ${isActive
                      ? 'bg-accent-cyan text-on-accent border-accent-cyan'
                      : 'bg-cyber-surface text-cyber-secondary border-cyber-border hover:border-cyber-border-strong hover:text-cyber-primary'}
                  `}
                >
                  {pill.label}
                  {pill.count !== undefined && (
                    <span className={`font-mono text-2xs tabular-nums ${isActive ? 'opacity-80' : 'text-cyber-muted'}`}>{pill.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-cyber-muted min-h-[1.5rem]">
          <p aria-live="polite">
            Showing <span className="font-semibold text-cyber-primary tabular-nums">{filteredTasks.length}</span> of {tasks.length} tasks
          </p>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="h-8 px-2 rounded-md font-semibold text-accent-cyan hover:bg-accent-cyan/10 transition-colors duration-fast cursor-pointer">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Deliverables Grid */}
      {filteredTasks.length === 0 ? (
        tasks.length === 0 ? (
          <EmptyState
            illustration="telemetry"
            title={isHeadOrAdmin ? 'No tasks yet' : 'Nothing assigned yet'}
            description={
              isHeadOrAdmin
                ? 'Create the first deliverable for your sub-team. Assignees are notified instantly.'
                : 'When your group head assigns you a deliverable, it will appear here.'
            }
            actionLabel={isHeadOrAdmin ? 'Create a task' : undefined}
            onAction={isHeadOrAdmin ? () => setIsCreateModalOpen(true) : undefined}
          />
        ) : (
          <EmptyState
            illustration="wheel"
            title="No tasks match these filters"
            description={searchQuery.trim() ? `Nothing matches "${searchQuery.trim()}". Try another keyword or clear the filters.` : 'Try a different status filter to see more work.'}
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        )
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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
        </ul>
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
          onClose={() => setSelectedTask(null)}
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
