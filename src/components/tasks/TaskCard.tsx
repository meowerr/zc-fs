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
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onSelect, groupName }) => {
  const deadlineDate = new Date(task.deadline);
  const now = new Date();
  const isOverdue = deadlineDate < now && task.status !== 'done' && task.status !== 'approved';
  
  // Format deadline human-readably
  const formatDeadline = (d: Date) => {
    const diffHours = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (diffHours < 0) {
      return `OVERDUE by ${Math.abs(Math.round(diffHours / 24))}d`;
    }
    if (diffHours < 24) {
      return `Due in ${diffHours}h`;
    }
    return `Due in ${Math.round(diffHours / 24)}d`;
  };

  const typeColorClasses: Record<string, string> = {
    design: 'bg-telemetry-blue/15 text-telemetry-blue border-telemetry-blue/30',
    code: 'bg-telemetry-aqua/15 text-telemetry-aqua border-telemetry-aqua/30',
    report: 'bg-telemetry-pink/15 text-telemetry-pink border-telemetry-pink/30',
    read: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    research: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    other: 'bg-white/10 text-chrome-900/70 dark:text-white/70 border-white/20',
  };

  return (
    <GlassCard
      onClick={() => onSelect(task)}
      className="p-4 sm:p-5 hover:border-telemetry-blue/60 transition-all cursor-pointer group shadow-sm hover:shadow-md"
    >
      <div className="flex flex-col gap-3">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${typeColorClasses[task.task_type] || typeColorClasses.other}`}>
              {task.task_type}
            </span>
            {groupName && (
              <span className="text-[11px] font-mono text-chrome-900/50 dark:text-white/40 truncate max-w-[140px]">
                {groupName}
              </span>
            )}
          </div>

          <LedStatusChip status={task.status} size="sm" />
        </div>

        {/* Task Title & Description Snippet */}
        <div>
          <h4 className="font-sans font-bold text-sm sm:text-base text-chrome-900 dark:text-white group-hover:text-telemetry-blue dark:group-hover:text-telemetry-aqua transition-colors line-clamp-2">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-chrome-900/70 dark:text-white/60 line-clamp-2 mt-1 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Footer: Assignees + Deadline + Links Count */}
        <div className="flex items-center justify-between pt-2.5 border-t border-chrome-300/50 dark:border-white/10 text-xs">
          {/* Assignees */}
          <div className="flex items-center gap-1.5">
            {task.assignees && task.assignees.length > 0 ? (
              <div className="flex items-center -space-x-2">
                {task.assignees.slice(0, 3).map((a) => (
                  <ChromeAvatar key={a.id} name={a.full_name} role={a.role} size="sm" />
                ))}
                {task.assignees.length > 3 && (
                  <span className="w-6 h-6 rounded-full bg-chrome-300 dark:bg-midnight-800 text-[10px] font-mono flex items-center justify-center font-bold">
                    +{task.assignees.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[11px] font-mono text-chrome-900/40 dark:text-white/40 italic">
                Unassigned
              </span>
            )}

            {task.links && task.links.length > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-chrome-900/50 dark:text-white/40">
                <Paperclip className="w-3 h-3" /> {task.links.length}
              </span>
            )}
          </div>

          {/* Deadline Chip */}
          <div className="flex items-center gap-1">
            <span
              className={`
                inline-flex items-center gap-1 font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full
                ${
                  isOverdue
                    ? 'bg-telemetry-red/15 text-telemetry-red border border-telemetry-red/40 animate-pulse'
                    : 'text-chrome-900/60 dark:text-white/60'
                }
              `}
            >
              {isOverdue ? (
                <AlertTriangle className="w-3 h-3 text-telemetry-red" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              {formatDeadline(deadlineDate)}
            </span>

            <ChevronRight className="w-4 h-4 text-chrome-900/30 dark:text-white/30 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
