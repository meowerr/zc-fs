import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  Link as LinkIcon, 
  UserPlus
} from 'lucide-react';
import { ModalShell } from '../common/ModalShell';
import { GlossyButton } from '../common/GlossyButton';
import { GhostButton } from '../common/GhostButton';
import { GlowInput } from '../common/GlowInput';
import { SUB_TEAMS } from '../../lib/constants';
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

  const modalFooter = (
    <div className="flex items-center justify-end gap-2">
      <GhostButton type="button" size="sm" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </GhostButton>
      <GlossyButton
        type="submit"
        form="task-create-form"
        variant="primary"
        size="sm"
        disabled={isSubmitting || !title.trim()}
        icon={<Plus className="w-4 h-4" />}
      >
        {isSubmitting ? 'Dispatching...' : 'Launch Task'}
      </GlossyButton>
    </div>
  );

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      title="Create Sub-Team Task"
      footer={modalFooter}
      maxWidth="md:max-w-xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-mono">
            {error}
          </div>
        )}

        <form id="task-create-form" onSubmit={handleSubmit} className="space-y-4">
          <GlowInput
            label="Deliverable Title"
            placeholder="e.g. Front Wing CFD Simulation (20 m/s)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5">
              Description & Specifications
            </label>
            <textarea
              rows={3}
              placeholder="State aerodynamic goals, CAD constraints, or compliance benchmarks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl text-base sm:text-xs bg-cyber-surface border border-cyber-border text-cyber-primary placeholder:text-cyber-muted focus:outline-none focus:border-accent-cyan font-sans resize-none"
            />
          </div>

          {/* Sub-team selection (for Club Admin) */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5">
                Assign to Sub-Team Division
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl text-base sm:text-xs font-mono font-medium uppercase bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
              >
                {SUB_TEAMS.map((team) => (
                  <option key={team.id} value={team.id} className="bg-cyber-surface text-cyber-primary">
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type & Priority Row - responsive single column on phones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5">
                Task Type
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TaskType)}
                className="w-full min-h-[44px] px-3 rounded-xl text-base sm:text-xs font-mono font-medium uppercase bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
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
              <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full min-h-[44px] px-3 rounded-xl text-base sm:text-xs font-mono font-medium uppercase bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
              >
                <option value="low" className="bg-cyber-surface text-cyber-primary">Low Priority</option>
                <option value="medium" className="bg-cyber-surface text-cyber-primary">Medium Priority</option>
                <option value="high" className="bg-cyber-surface text-cyber-primary">High Priority</option>
                <option value="urgent" className="bg-cyber-surface text-accent-red">Urgent / Critical</option>
              </select>
            </div>
          </div>

          {/* Deadline Row - responsive single column on phones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-accent-cyan" />
                <span>Deadline Date</span>
              </label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl text-base sm:text-xs font-mono bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5">
                Deadline Time
              </label>
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl text-base sm:text-xs font-mono bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
                required
              />
            </div>
          </div>

          {/* Assignees Selector */}
          <div>
            <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Assign Engineers</span>
            </label>

            {availableMembers.length === 0 ? (
              <div className="p-3 rounded-xl bg-cyber-surface border border-cyber-border text-xs text-cyber-muted italic font-mono">
                No active engineers in this sub-team.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 border border-cyber-border rounded-xl bg-cyber-surface">
                {availableMembers.map((m) => {
                  const isChecked = selectedAssigneeIds.includes(m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggleAssignee(m.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all border cursor-pointer min-h-[44px] ${
                        isChecked
                          ? 'bg-accent-cyan/15 border-accent-cyan text-cyber-primary shadow-sm'
                          : 'bg-transparent border-transparent hover:bg-cyber-surface-hover text-cyber-secondary'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-cyber-border text-accent-cyan focus:ring-0 cursor-pointer pointer-events-none"
                      />
                      <span className="text-xs truncate">{m.full_name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reference Links */}
          <div>
            <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-cyber-secondary flex items-center gap-1.5 mb-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Reference CAD / Docs</span>
            </label>

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <input
                type="text"
                placeholder="Label (e.g. Onshape Assembly)"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="w-full sm:w-1/3 min-h-[44px] px-3 rounded-lg text-base sm:text-xs bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan placeholder:text-cyber-muted"
              />
              <input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full sm:flex-1 min-h-[44px] px-3 rounded-lg text-base sm:text-xs bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan placeholder:text-cyber-muted"
              />
              <button
                type="button"
                onClick={handleAddLink}
                className="min-h-[44px] px-4 rounded-lg bg-cyber-surface-hover hover:bg-cyber-border border border-cyber-border text-label font-mono font-medium text-cyber-primary cursor-pointer transition-colors shrink-0"
              >
                + Add Link
              </button>
            </div>

            {links.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {links.map((lnk, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 px-3 rounded-lg bg-cyber-surface border border-cyber-border text-xs font-mono"
                  >
                    <span className="truncate text-accent-cyan">
                      {lnk.title}: {lnk.url}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="text-accent-red hover:underline text-xs ml-2 cursor-pointer p-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    </ModalShell>
  );
};
