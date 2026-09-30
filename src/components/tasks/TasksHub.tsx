import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Layers, 
  Gauge
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { TaskCard } from './TaskCard';
import { TaskCreateModal } from './TaskCreateModal';
import { TaskDetailModal } from './TaskDetailModal';
import { SUB_TEAMS } from '../admin/AdminApprovalHub';
import { 
  Task, 
  TaskStatus, 
  SubmissionType, 
  SubmissionReviewStatus, 
  Profile, 
  TaskType, 
  TaskPriority 
} from '../../lib/database.types';

interface TasksHubProps {
  currentUser: Profile;
  tasks: Task[];
  teamMembers: Profile[];
  submissions: Record<string, any>;
  comments: Record<string, any>;
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
}

export const TasksHub: React.FC<TasksHubProps> = ({
  currentUser,
  tasks,
  teamMembers,
  submissions,
  comments,
  onCreateTask,
  onUpdateStatus,
  onSubmitWork,
  onReviewSubmission,
  onAddComment,
}) => {
  const [filter, setFilter] = useState<'all' | 'my_tasks' | 'submitted' | 'in_progress' | 'approved' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  const isHeadOrAdmin = currentUser.role === 'admin' || currentUser.role === 'head';
  const now = new Date();

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
  const completedCount = tasks.filter((t) => t.status === 'approved' || t.status === 'done').length;

  return (
    <div className="space-y-6">
      {/* Top Telemetry Header & Stats */}
      <GlassCard variant="elevated" className="p-5 sm:p-6 border-telemetry-blue/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-telemetry-blue/15 text-telemetry-blue font-mono text-xs font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>DELIVERABLES TELEMETRY</span>
            </div>
            <h2 className="font-display font-black text-2xl text-chrome-900 dark:text-white uppercase tracking-wider">
              {currentUser.role === 'admin'
                ? 'Club-Wide Task Telemetry'
                : `${currentUser.role === 'head' ? 'Pit Wall' : 'My Deliverables'} Workspace`}
            </h2>
            <p className="text-xs text-chrome-900/60 dark:text-white/60">
              Track milestones, submit engineering work, and maintain multi-version review history.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {isHeadOrAdmin && (
              <GlossyButton
                variant="holo"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Task
              </GlossyButton>
            )}
          </div>
        </div>

        {/* Telemetry Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-chrome-300/60 dark:border-white/10">
          <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
            <div className="text-[10px] font-mono text-chrome-900/60 dark:text-white/50 uppercase">Total Tasks</div>
            <div className="text-xl font-display font-bold text-chrome-900 dark:text-white">{tasks.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
            <div className="text-[10px] font-mono text-chrome-900/60 dark:text-white/50 uppercase">Awaiting Review</div>
            <div className="text-xl font-display font-bold text-telemetry-amber">{inReviewCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
            <div className="text-[10px] font-mono text-chrome-900/60 dark:text-white/50 uppercase">Overdue Critical</div>
            <div className="text-xl font-display font-bold text-telemetry-red">{overdueCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
            <div className="text-[10px] font-mono text-chrome-900/60 dark:text-white/50 uppercase">Approved / Done</div>
            <div className="text-xl font-display font-bold text-[#8ED91E]">{completedCount}</div>
          </div>
        </div>
      </GlassCard>

      {/* Filter & Search Bar */}
      <GlassCard className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-chrome-900/40 dark:text-white/40" />
            <input
              type="text"
              placeholder="Search deliverables by name, description, or engineer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl text-xs bg-white/70 dark:bg-midnight-950/60 border border-chrome-300 dark:border-white/15 text-chrome-900 dark:text-white focus:outline-none focus:border-telemetry-blue"
            />
          </div>

          {/* Group Filter for Admin */}
          {currentUser.role === 'admin' && (
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="h-10 px-3 rounded-xl text-xs font-mono font-semibold bg-white dark:bg-midnight-900 border border-chrome-300 dark:border-white/15 text-chrome-900 dark:text-white focus:outline-none focus:border-telemetry-blue"
            >
              <option value="all">All 5 Sub-Teams</option>
              {SUB_TEAMS.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-chrome-300/40 dark:border-white/5">
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'my_tasks', label: 'My Deliverables' },
            { id: 'submitted', label: `In Review (${inReviewCount})` },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'overdue', label: `Overdue (${overdueCount})` },
            { id: 'approved', label: 'Approved' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilter(pill.id as any)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase transition-all cursor-pointer
                ${
                  filter === pill.id
                    ? 'bg-telemetry-blue text-white shadow-neon-blue/30'
                    : 'bg-white/40 dark:bg-white/5 text-chrome-900/60 dark:text-white/60 hover:bg-white/80'
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
        <GlassCard className="p-12 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-telemetry-blue/15 flex items-center justify-center text-telemetry-blue">
            <Gauge className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-base text-chrome-900 dark:text-white">
            No Deliverables Found
          </h3>
          <p className="text-xs text-chrome-900/60 dark:text-white/50 max-w-sm mx-auto">
            {searchQuery
              ? 'No deliverables match your search query.'
              : 'No tasks currently exist under this filter.'}
          </p>
          {isHeadOrAdmin && (
            <div className="pt-2">
              <GlossyButton size="sm" variant="holo" onClick={() => setIsCreateModalOpen(true)}>
                + Create First Task
              </GlossyButton>
            </div>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const group = SUB_TEAMS.find((g) => g.id === task.group_id);
            return (
              <TaskCard
                key={task.id}
                task={task}
                groupName={group ? group.name.replace('Technical - ', '') : undefined}
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
        />
      )}
    </div>
  );
};
