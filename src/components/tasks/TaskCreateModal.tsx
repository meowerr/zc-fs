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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <GlassCard variant="elevated" className="w-full max-w-lg p-6 sm:p-7 my-8 border-cyber-border-strong shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyber-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-cyber-primary uppercase tracking-wider">
                Create Sub-Team Task
              </h3>
              <p className="text-xs font-mono text-cyber-muted">
                Formula Student Engineering Deliverable
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-cyber-surface-hover transition-colors text-cyber-muted hover:text-cyber-primary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-mono">
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
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5">
              Description & Specifications
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline engineering constraints, required software (Ansys, SolidWorks, MATLAB), and acceptance criteria..."
              className="w-full p-3 rounded-xl text-sm font-sans bg-cyber-surface border border-cyber-border focus:outline-none focus:border-accent-cyan text-cyber-primary placeholder:text-cyber-muted"
            />
          </div>

          {/* Sub-Team Selection (If Admin) */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5">
                Assign to Sub-Team
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl text-sm font-sans bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
              >
                {SUB_TEAMS.map((team) => (
                  <option key={team.id} value={team.id} className="bg-cyber-surface text-cyber-primary">
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5">
                Task Type
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TaskType)}
                className="w-full h-11 px-3 rounded-xl text-xs font-mono font-bold uppercase bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
              >
                <option value="design" className="bg-cyber-surface text-cyber-primary">Design (CAD/FEA)</option>
                <option value="code" className="bg-cyber-surface text-cyber-primary">Code (Firmware/Sim)</option>
                <option value="report" className="bg-cyber-surface text-cyber-primary">Report (BOM/Docs)</option>
                <option value="read" className="bg-cyber-surface text-cyber-primary">Read (Rules/Papers)</option>
                <option value="research" className="bg-cyber-surface text-cyber-primary">Research</option>
                <option value="other" className="bg-cyber-surface text-cyber-primary">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full h-11 px-3 rounded-xl text-xs font-mono font-bold uppercase bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
              >
                <option value="low" className="bg-cyber-surface text-cyber-primary">Low Priority</option>
                <option value="medium" className="bg-cyber-surface text-cyber-primary">Medium Priority</option>
                <option value="high" className="bg-cyber-surface text-cyber-primary">High Priority</option>
                <option value="urgent" className="bg-cyber-surface text-accent-red">Urgent / Critical</option>
              </select>
            </div>
          </div>

          {/* Deadline Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-accent-cyan" /> Deadline Date
              </label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl text-xs font-mono bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5">
                Time (UTC+2)
              </label>
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full h-11 px-3 rounded-xl text-xs font-mono bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
                required
              />
            </div>
          </div>

          {/* Assignees Selector */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-accent-cyan" /> Assign Team Members
            </label>
            <div className="max-h-28 overflow-y-auto p-2 rounded-xl bg-cyber-surface border border-cyber-border space-y-1.5">
              {availableMembers.length === 0 ? (
                <div className="text-xs text-cyber-muted italic p-1 font-mono">
                  No approved members in this group yet.
                </div>
              ) : (
                availableMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-cyber-surface-hover cursor-pointer text-xs transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssigneeIds.includes(member.id)}
                      onChange={() => toggleAssignee(member.id)}
                      className="w-4 h-4 rounded text-accent-cyan focus:ring-accent-cyan bg-cyber-surface border-cyber-border"
                    />
                    <span className="font-semibold text-cyber-primary">
                      {member.full_name}
                    </span>
                    <span className="text-[10px] font-mono text-cyber-muted">
                      ({member.role})
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Reference Links */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-cyber-secondary flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-accent-cyan" /> Reference CAD / Repo Links
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Title (e.g. Onshape CAD)"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="w-1/3 h-9 px-3 rounded-lg text-xs bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan placeholder:text-cyber-muted"
              />
              <input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg text-xs bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan placeholder:text-cyber-muted"
              />
              <button
                type="button"
                onClick={handleAddLink}
                className="h-9 px-3 rounded-lg bg-cyber-surface-hover hover:bg-cyber-border border border-cyber-border text-xs font-mono font-bold text-cyber-primary cursor-pointer transition-colors"
              >
                Add
              </button>
            </div>

            {links.length > 0 && (
              <div className="space-y-1">
                {links.map((lnk, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-cyber-surface border border-cyber-border text-xs font-mono"
                  >
                    <span className="truncate text-accent-cyan">
                      {lnk.title}: {lnk.url}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="text-accent-red hover:underline text-xs ml-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-cyber-border">
            <GhostButton type="button" onClick={onClose}>
              Cancel
            </GhostButton>
            <GlossyButton
              type="submit"
              variant="primary"
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
