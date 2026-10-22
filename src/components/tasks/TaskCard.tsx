import React from 'react';
import { Clock, AlertTriangle, Paperclip, ChevronRight } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { LedStatusChip } from '../common/LedStatusChip';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { Task } from '../../lib/database.types';

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
  groupName?: string;
  groupAccent?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onSelect, groupName, groupAccent }) => {
  const deadlineDate = new Date(task.deadline);
  const now = new Date();
  const isOverdue = deadlineDate < now && task.status !== 'done' && task.status !== 'approved';
  
  // Format deadline human-readably
  const formatDeadline = (d: Date) => {
    const diffMins = Math.round((d.getTime() - now.getTime()) / 60000);
    if (diffMins < 0) {
      const absM = Math.abs(diffMins);
      if (absM < 60) return `Overdue ${absM}m`;
      if (absM < 1440) return `Overdue ${Math.floor(absM / 60)}h`;
      return `Overdue ${Math.floor(absM / 1440)}d`;
    }
    if (diffMins < 60) return `Due ${diffMins}m`;
    if (diffMins < 1440) return `Due ${Math.floor(diffMins / 60)}h`;
    return `Due ${Math.floor(diffMins / 1440)}d`;
  };

  const typeColorClasses: Record<string, string> = {
    design: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30',
    code: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    report: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30',
    read: 'bg-cyber-surface-elevated text-cyber-secondary border-cyber-border',
    research: 'bg-cyber-surface-elevated text-cyber-secondary border-cyber-border',
    other: 'bg-cyber-surface-elevated text-cyber-muted border-cyber-border',
  };

  return (
    <GlassCard
      onClick={() => onSelect(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(task);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Deliverable: ${task.title}. Status: ${task.status}. Priority: ${task.priority}.`}
      accentColor={groupAccent}
      className="p-4 hover:border-accent-cyan/60 focus:outline-none focus:ring-2 focus:ring-accent-cyan/60 active:bg-cyber-surface-hover active:scale-[0.99] transition-all cursor-pointer group shadow-cyber-sm hover:shadow-cyber"
    >
      <div className="flex flex-col gap-2.5">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {groupAccent && (
              <span 
                className="w-2 h-2 rounded-full shrink-0" 
                style={{ backgroundColor: groupAccent }} 
                title={groupName}
              />
            )}
            <span className={`hidden sm:inline-block px-1.5 py-0.5 rounded text-label font-mono uppercase border ${typeColorClasses[task.task_type] || typeColorClasses.other}`}>
              {task.task_type}
            </span>
            {groupName && (
              <span className="text-label font-mono text-cyber-muted truncate max-w-[120px]">
                {groupName}
              </span>
            )}
            {(task.priority === 'urgent' || task.priority === 'high') && (
              <LedStatusChip status={task.priority} size="sm" />
            )}
          </div>

          <LedStatusChip status={task.status} size="sm" />
        </div>

        {/* Task Title & Description Snippet */}
        <div>
          <h4 className="font-sans font-semibold text-base text-cyber-primary group-hover:text-accent-cyan transition-colors line-clamp-2 leading-snug">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-sm font-sans text-cyber-secondary line-clamp-2 mt-1 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Footer: Assignees + Deadline + Links Count */}
        <div className="flex items-center justify-between pt-2 border-t border-cyber-border text-xs gap-2">
          {/* Assignees */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {task.assignees && task.assignees.length > 0 ? (
              <div className="flex items-center -space-x-1.5">
                {task.assignees.slice(0, 3).map((a) => (
                  <ChromeAvatar key={a.id} name={a.full_name} role={a.role} size="sm" />
                ))}
                {task.assignees.length > 3 && (
                  <span className="w-7 h-7 rounded-lg bg-cyber-surface-elevated border border-cyber-border text-label font-mono flex items-center justify-center text-cyber-secondary">
                    +{task.assignees.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-label font-mono text-cyber-muted italic">
                Unassigned
              </span>
            )}

            {task.links && task.links.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label font-mono text-cyber-muted">
                <Paperclip className="w-3 h-3" /> {task.links.length}
              </span>
            )}
          </div>

          {/* Deadline Chip */}
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`
                inline-flex items-center gap-1 font-mono text-label px-1.5 py-0.5 rounded
                ${
                  isOverdue
                    ? 'bg-accent-red/10 text-accent-red border border-accent-red/30'
                    : 'text-cyber-muted'
                }
              `}
            >
              {isOverdue ? (
                <AlertTriangle className="w-3 h-3 text-accent-red" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              {formatDeadline(deadlineDate)}
            </span>

            <ChevronRight className="w-3.5 h-3.5 text-cyber-muted group-hover:text-accent-cyan group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
