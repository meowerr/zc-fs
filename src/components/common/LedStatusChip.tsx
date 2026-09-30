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
          dotColor: 'bg-accent-lime shadow-[0_0_6px_rgba(16,229,122,0.4)]',
          icon: <CheckCircle2 className="w-3 h-3" />,
        };
      case 'submitted':
      case 'pending':
        return {
          label: customLabel || (status === 'submitted' ? 'IN REVIEW' : 'PENDING'),
          colorClasses: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30',
          dotColor: 'bg-accent-yellow shadow-[0_0_6px_rgba(255,212,59,0.4)] animate-pulse',
          icon: <Clock className="w-3 h-3" />,
        };
      case 'in_progress':
        return {
          label: customLabel || 'IN PROGRESS',
          colorClasses: 'bg-accent-orange/10 text-accent-orange border-accent-orange/30',
          dotColor: 'bg-accent-orange shadow-[0_0_6px_rgba(255,106,0,0.4)]',
          icon: <RotateCcw className="w-3 h-3" />,
        };
      case 'changes_requested':
      case 'urgent':
      case 'high':
        return {
          label: customLabel || (status === 'changes_requested' ? 'REVISIONS REQ' : status === 'urgent' ? 'CRITICAL' : 'HIGH PRIORITY'),
          colorClasses: 'bg-accent-red/10 text-accent-red border-accent-red/30',
          dotColor: 'bg-accent-red shadow-[0_0_6px_rgba(255,48,79,0.5)] animate-pulse',
          icon: status === 'urgent' ? <Flame className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />,
        };
      case 'medium':
        return {
          label: customLabel || 'MED PRIORITY',
          colorClasses: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30',
          dotColor: 'bg-accent-yellow',
          icon: <Clock className="w-3 h-3" />,
        };
      case 'low':
        return {
          label: customLabel || 'LOW PRIORITY',
          colorClasses: 'bg-cyber-surface-elevated text-cyber-secondary border-cyber-border',
          dotColor: 'bg-cyber-muted',
          icon: <Sliders className="w-3 h-3" />,
        };
      case 'todo':
        return {
          label: customLabel || 'TO DO',
          colorClasses: 'bg-cyber-surface-elevated text-cyber-muted border-cyber-border',
          dotColor: 'bg-cyber-muted',
          icon: <CircleDashed className="w-3 h-3" />,
        };
      case 'online':
        return {
          label: customLabel || 'ONLINE',
          colorClasses: 'bg-accent-lime/10 text-accent-lime border-accent-lime/30',
          dotColor: 'bg-accent-lime shadow-[0_0_6px_rgba(16,229,122,0.5)] animate-pulse',
          icon: <Radio className="w-3 h-3" />,
        };
      case 'system':
        return {
          label: customLabel || 'SYSTEM',
          colorClasses: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30',
          dotColor: 'bg-accent-cyan shadow-[0_0_6px_rgba(0,217,255,0.4)]',
          icon: <Radio className="w-3 h-3" />,
        };
      default:
        return {
          label: customLabel || String(status).toUpperCase(),
          colorClasses: 'bg-cyber-surface-elevated text-cyber-secondary border-cyber-border',
          dotColor: 'bg-cyber-muted',
          icon: <CircleDashed className="w-3 h-3" />,
        };
    }
  };

  const { label, colorClasses, dotColor, icon } = getStatusConfig();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded font-mono font-bold tracking-wider border
        select-none transition-all
        ${sizeClasses}
        ${colorClasses}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  );
};
