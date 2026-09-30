import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Calendar, 
  Link as LinkIcon, 
  UserPlus, 
  Layers
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { GhostButton } from '../common/GhostButton';
import { GlowInput } from '../common/GlowInput';
import { SUB_TEAMS } from '../admin/AdminApprovalHub';
import { TaskType, TaskPriority, Profile } from '../../lib/database.types';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserGroup: string | null;
  isAdmin: boolean;
  teamMembers: Profile[];
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
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  currentUserGroup,
  isAdmin,
  teamMembers,
  onCreateTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState<string>(currentUserGroup || SUB_TEAMS[0].id);
  const [taskType, setTaskType] = useState<TaskType>('design');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadlineDate, setDeadlineDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  });
  const [deadlineTime, setDeadlineTime] = useState('18:00');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [links, setLinks] = useState<Array<{ title: string; url: string }>>([]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter members eligible for this task's sub-team
  const availableMembers = teamMembers.filter(
    (m) => m.status === 'approved' && (isAdmin || m.group_id === groupId)
  );

  const handleAddLink = () => {
    if (linkUrl) {
      setLinks((prev) => [
        ...prev,
        { title: linkTitle || 'Reference CAD / Doc', url: linkUrl },
      ]);
      setLinkTitle('');
      setLinkUrl('');
    }
  };

  const handleRemoveLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    const fullDeadline = new Date(`${deadlineDate}T${deadlineTime}:00`).toISOString();
    const chosenAssignees = teamMembers.filter((m) => selectedAssigneeIds.includes(m.id));

    setIsSubmitting(true);
    try {
      await onCreateTask({
        title,
        description,
        groupId,
        taskType,
        priority,
        deadline: fullDeadline,
        links,
        assigneeIds: selectedAssigneeIds,
        assignees: chosenAssignees,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create task';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <GlassCard variant="elevated" className="w-full max-w-lg p-6 sm:p-7 my-8 border-telemetry-blue/40 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-chrome-300/60 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-telemetry-blue/15 text-telemetry-blue">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-chrome-900 dark:text-white uppercase tracking-wider">
                Create Sub-Team Task
              </h3>
              <p className="text-xs font-mono text-chrome-900/50 dark:text-white/40">
                Formula Student Engineering Deliverable
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-chrome-900/60 dark:text-white/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-telemetry-red/10 border border-telemetry-red/40 text-telemetry-red text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <GlowInput
            label="Deliverable Title"
            placeholder="e.g. Front Wing CFD Simulation (20 m/s)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-chrome-900/80 dark:text-chrome-200 mb-1.5">
              Description & Specifications
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline engineering constraints, required software (Ansys, SolidWorks, MATLAB), and acceptance criteria..."
              className="w-full p-3 rounded-xl text-sm font-sans bg-white/70 dark:bg-midnight-950/60 border border-chrome-300 dark:border-white/15 focus:outline-none focus:border-telemetry-blue text-chrome-900 dark:text-white"
            />
          </div>

          {/* Sub-Team Selection (If Admin) */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-chrome-900/80 dark:text-chrome-200 mb-1.5">
                Assign to Sub-Team
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl text-sm font-sans bg-white dark:bg-midnight-900 border border-chrome-300 dark:border-white/15 text-chrome-900 dark:text-white focus:outline-none focus:border-telemetry-blue"
              >
                {SUB_TEAMS.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-chrome-900/80 dark:text-chrome-200 mb-1.5">
                Task Type
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TaskType)}
                className="w-full h-11 px-3 rounded-xl text-xs font-mono font-bold uppercase bg-white dark:bg-midnight-900 border border-chrome-300 dark:border-white/15 text-chrome-900 dark:text-white focus:outline-none focus:border-telemetry-blue"
              >
                <option value="design">Design (CAD/FEA)</option>
                <option value="code">Code (Firmware/Sim)</option>
                <option value="report">Report (BOM/Docs)</option>
                <option value="read">Read (Rules/Papers)</option>
                <option value="research">Research</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-chrome-900/80 dark:text-chrome-200 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full h-11 px-3 rounded-xl text-xs font-mono font-bold uppercase bg-white dark:bg-midnight-900 border border-chrome-300 dark:border-white/15 text-chrome-900 dark:text-white focus:outline-none focus:border-telemetry-blue"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent / Critical</option>
              </select>
            </div>
          </div>

          {/* Deadline Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-chrome-900/80 dark:text-chrome-200 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Deadline Date
              </label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl text-xs font-mono bg-white dark:bg-midnight-900 border border-chrome-300 dark:border-white/15 text-chrome-900 dark:text-white focus:outline-none focus:border-telemetry-blue"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-chrome-900/80 dark:text-chrome-200 mb-1.5">
                Time (UTC+2)
              </label>
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full h-11 px-3 rounded-xl text-xs font-mono bg-white dark:bg-midnight-900 border border-chrome-300 dark:border-white/15 text-chrome-900 dark:text-white focus:outline-none focus:border-telemetry-blue"
                required
              />
            </div>
          </div>

          {/* Assignees Selector */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-chrome-900/80 dark:text-chrome-200 mb-1.5 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" /> Assign Team Members
            </label>
            <div className="max-h-28 overflow-y-auto p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 space-y-1.5">
              {availableMembers.length === 0 ? (
                <div className="text-xs text-chrome-900/50 dark:text-white/40 italic p-1">
                  No approved members in this group yet.
                </div>
              ) : (
                availableMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssigneeIds.includes(member.id)}
                      onChange={() => toggleAssignee(member.id)}
                      className="w-4 h-4 rounded text-telemetry-blue focus:ring-telemetry-blue"
                    />
                    <span className="font-semibold text-chrome-900 dark:text-white">
                      {member.full_name}
                    </span>
                    <span className="text-[10px] font-mono text-chrome-900/50 dark:text-white/40">
                      ({member.role})
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Reference Links */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-chrome-900/80 dark:text-chrome-200 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" /> Reference CAD / Repo Links
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Title (e.g. Onshape CAD)"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="w-1/3 h-9 px-3 rounded-lg text-xs bg-white dark:bg-midnight-900 border border-chrome-300 dark:border-white/15 text-chrome-900 dark:text-white"
              />
              <input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg text-xs bg-white dark:bg-midnight-900 border border-chrome-300 dark:border-white/15 text-chrome-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddLink}
                className="h-9 px-3 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-xs font-mono font-bold cursor-pointer"
              >
                Add
              </button>
            </div>

            {links.length > 0 && (
              <div className="space-y-1">
                {links.map((lnk, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 text-xs font-mono"
                  >
                    <span className="truncate text-telemetry-blue dark:text-telemetry-aqua">
                      {lnk.title}: {lnk.url}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="text-telemetry-red hover:underline text-xs ml-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-chrome-300/60 dark:border-white/10">
            <GhostButton type="button" onClick={onClose}>
              Cancel
            </GhostButton>
            <GlossyButton
              type="submit"
              variant="holo"
              disabled={isSubmitting}
              icon={<Plus className="w-4 h-4" />}
            >
              {isSubmitting ? 'Dispatching...' : 'Launch Task'}
            </GlossyButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
