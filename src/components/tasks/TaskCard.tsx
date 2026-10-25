import React from 'react';
import { Clock, AlertTriangle, Paperclip, ChevronRight } from 'lucide-react';
import { LedStatusChip } from '../common/LedStatusChip';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { Task } from '../../lib/database.types';

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
  groupName?: string;
  groupAccent?: string;
}

export const formatDeadline = (deadline: Date, now = new Date()) => {
  const diffHours = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
  if (diffHours < 0) {
    const days = Math.max(1, Math.round(Math.abs(diffHours) / 24));
    return `Overdue by ${days}d`;
  }
  if (diffHours < 24) return diffHours <= 1 ? 'Due within the hour' : `Due in ${diffHours}h`;
  return `Due in ${Math.round(diffHours / 24)}d`;
};

const typeColorClasses: Record<string, string> = {
  design: 'text-accent-cyan border-accent-cyan/30 bg-accent-cyan/10',
  code: 'text-accent-orange border-accent-orange/30 bg-accent-orange/10',
  report: 'text-accent-yellow border-accent-yellow/30 bg-accent-yellow/10',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onSelect, groupName, groupAccent }) => {
  const deadlineDate = new Date(task.deadline);
  const isDone = task.status === 'done' || task.status === 'approved';
  const isOverdue = deadlineDate < new Date() && !isDone;
  const isDueSoon = !isOverdue && !isDone && deadlineDate.getTime() - Date.now() < 1000 * 60 * 60 * 48;

  return (
    <li className="h-full">
      <button
        type="button"
        onClick={() => onSelect(task)}
        className="group relative h-full w-full text-left flex flex-col gap-3 p-4 pl-5 rounded-xl bg-cyber-surface border border-cyber-border hover:border-accent-cyan/50 hover:bg-cyber-surface-elevated shadow-cyber-sm transition-colors duration-fast cursor-pointer overflow-hidden"
      >
        <span
          className="absolute left-0 inset-y-0 w-1"
          style={{ backgroundColor: groupAccent || 'var(--border-strong)' }}
          aria-hidden="true"
        />

        <span className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-2 flex-wrap min-w-0">
            <span
              className={`inline-flex items-center h-6 px-2 rounded-md text-2xs font-mono font-bold uppercase border ${
                typeColorClasses[task.task_type] || 'text-cyber-secondary border-cyber-border bg-cyber-surface-elevated'
              }`}
            >
              {task.task_type}
            </span>
            {groupName && <span className="text-xs text-cyber-muted truncate max-w-[160px]">{groupName}</span>}
          </span>
          <LedStatusChip status={task.status} size="sm" />
        </span>

        <span className="flex-1 block">
          <span className="block font-semibold text-sm sm:text-[15px] text-cyber-primary group-hover:text-accent-cyan transition-colors duration-fast line-clamp-2 leading-snug">
            {task.title}
          </span>
          {task.description && (
            <span className="block text-sm text-cyber-secondary line-clamp-2 mt-1 leading-relaxed">{task.description}</span>
          )}
        </span>

        <span className="flex items-center justify-between gap-2 pt-3 border-t border-cyber-border">
          <span className="flex items-center gap-2 min-w-0">
            {task.assignees && task.assignees.length > 0 ? (
              <span className="flex items-center -space-x-1.5" aria-label={`Assigned to ${task.assignees.map((a) => a.full_name).join(', ')}`}>
                {task.assignees.slice(0, 3).map((a) => (
                  <ChromeAvatar key={a.id} name={a.full_name} role={a.role} size="sm" />
                ))}
                {task.assignees.length > 3 && (
                  <span className="relative w-7 h-7 rounded-lg bg-cyber-surface-elevated border border-cyber-border text-2xs font-mono flex items-center justify-center font-bold text-cyber-secondary">
                    +{task.assignees.length - 3}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-xs text-cyber-muted">Unassigned</span>
            )}

            {task.links && task.links.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-cyber-muted" aria-label={`${task.links.length} attached links`}>
                <Paperclip className="w-3.5 h-3.5" aria-hidden="true" /> {task.links.length}
              </span>
            )}
          </span>

          <span className="flex items-center gap-1 shrink-0">
            <span
              className={`inline-flex items-center gap-1 h-6 px-2 rounded-md text-xs font-medium ${
                isOverdue
                  ? 'bg-accent-red/10 text-accent-red border border-accent-red/30'
                  : isDueSoon
                    ? 'text-accent-yellow'
                    : 'text-cyber-muted'
              }`}
            >
              {isOverdue ? (
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <time dateTime={task.deadline}>{isDone ? deadlineDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) : formatDeadline(deadlineDate)}</time>
            </span>
            <ChevronRight
              className="w-4 h-4 text-cyber-muted group-hover:text-accent-cyan group-hover:translate-x-0.5 transition-[color,transform] duration-fast"
              aria-hidden="true"
            />
          </span>
        </span>
      </button>
    </li>
  );
};
