import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RotateCcw, 
  CircleDashed,
  Flame,
  Radio,
  Sliders
} from 'lucide-react';
import { TaskStatus, TaskPriority } from '../../lib/database.types';

export type ChipType = TaskStatus | TaskPriority | 'online' | 'offline' | 'pending' | 'system';

interface LedStatusChipProps {
  status: ChipType;
  customLabel?: string;
  size?: 'sm' | 'md';
}

export const LedStatusChip: React.FC<LedStatusChipProps> = ({
  status,
  customLabel,
  size = 'md',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'done':
      case 'approved':
        return {
          label: customLabel || (status === 'done' ? 'DONE' : 'APPROVED'),
          colorClasses: 'bg-accent-lime/10 text-accent-lime border-accent-lime/30',
          icon: <CheckCircle2 className="w-3 h-3" />,
        };
      case 'submitted':
      case 'pending':
        return {
          label: customLabel || (status === 'submitted' ? 'IN REVIEW' : 'PENDING'),
          colorClasses: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30',
          icon: <Clock className="w-3 h-3" />,
        };
      case 'in_progress':
        return {
          label: customLabel || 'IN PROGRESS',
          colorClasses: 'bg-accent-orange/10 text-accent-orange border-accent-orange/30',
          icon: <RotateCcw className="w-3 h-3" />,
        };
      case 'changes_requested':
      case 'urgent':
      case 'high':
        return {
          label: customLabel || (status === 'changes_requested' ? 'REVISIONS REQ' : status === 'urgent' ? 'CRITICAL' : 'HIGH PRIORITY'),
          colorClasses: 'bg-accent-red/10 text-accent-red border-accent-red/30',
          icon: status === 'urgent' ? <Flame className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />,
        };
      case 'medium':
        return {
          label: customLabel || 'MED PRIORITY',
          colorClasses: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30',
          icon: <Clock className="w-3 h-3" />,
        };
      case 'low':
        return {
          label: customLabel || 'LOW PRIORITY',
          colorClasses: 'bg-cyber-surface-elevated text-cyber-secondary border-cyber-border',
          icon: <Sliders className="w-3 h-3" />,
        };
      case 'todo':
        return {
          label: customLabel || 'TO DO',
          colorClasses: 'bg-cyber-surface-elevated text-cyber-muted border-cyber-border',
          icon: <CircleDashed className="w-3 h-3" />,
        };
      case 'online':
        return {
          label: customLabel || 'ONLINE',
          colorClasses: 'bg-accent-lime/10 text-accent-lime border-accent-lime/30',
          icon: <Radio className="w-3 h-3" />,
        };
      case 'system':
        return {
          label: customLabel || 'SYSTEM',
          colorClasses: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30',
          icon: <Radio className="w-3 h-3" />,
        };
      default:
        return {
          label: customLabel || String(status).toUpperCase(),
          colorClasses: 'bg-cyber-surface-elevated text-cyber-secondary border-cyber-border',
          icon: <CircleDashed className="w-3 h-3" />,
        };
    }
  };

  const { label, colorClasses, icon } = getStatusConfig();
  const sizeClasses = size === 'sm' ? 'h-6 px-2 text-2xs' : 'h-7 px-2.5 text-xs';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-md font-mono font-bold tracking-wide border whitespace-nowrap
        select-none
        ${sizeClasses}
        ${colorClasses}
      `}
    >
      <span className="shrink-0" aria-hidden="true">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  );
};
