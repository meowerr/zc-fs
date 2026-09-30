import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RotateCcw, 
  Sparkles, 
  CircleDashed,
  Flame,
  Radio
} from 'lucide-react';
import { TaskStatus, TaskPriority } from '../../lib/database.types';

type ChipType = TaskStatus | TaskPriority | 'online' | 'offline' | 'pending';

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
          colorClasses: 'bg-[#B6FF3B]/15 text-[#4E8009] dark:text-[#B6FF3B] border-[#B6FF3B]/50',
          dotColor: 'bg-[#8ED91E] shadow-neon-lime',
          icon: <CheckCircle2 className="w-3 h-3" />,
        };
      case 'submitted':
      case 'medium':
        return {
          label: customLabel || (status === 'submitted' ? 'IN REVIEW' : 'MED PRIORITY'),
          colorClasses: 'bg-telemetry-amber/15 text-[#9E6E00] dark:text-telemetry-amber border-telemetry-amber/50',
          dotColor: 'bg-telemetry-amber shadow-[0_0_8px_#FFC53D]',
          icon: <Clock className="w-3 h-3" />,
        };
      case 'in_progress':
      case 'low':
        return {
          label: customLabel || (status === 'in_progress' ? 'IN PROGRESS' : 'LOW PRIORITY'),
          colorClasses: 'bg-telemetry-blue/15 text-telemetry-blue border-telemetry-blue/50',
          dotColor: 'bg-telemetry-blue shadow-neon-blue',
          icon: <RotateCcw className="w-3 h-3" />,
        };
      case 'changes_requested':
      case 'urgent':
      case 'high':
        return {
          label: customLabel || (status === 'changes_requested' ? 'REVISIONS REQ' : status === 'urgent' ? 'CRITICAL' : 'HIGH PRIORITY'),
          colorClasses: 'bg-telemetry-red/15 text-telemetry-red border-telemetry-red/50',
          dotColor: 'bg-telemetry-red shadow-[0_0_8px_#FF4D4D] animate-pulse',
          icon: status === 'urgent' ? <Flame className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />,
        };
      case 'todo':
        return {
          label: customLabel || 'TO DO',
          colorClasses: 'bg-chrome-300/30 text-chrome-800 dark:text-chrome-200 border-chrome-300 dark:border-white/20',
          dotColor: 'bg-chrome-400',
          icon: <CircleDashed className="w-3 h-3" />,
        };
      case 'pending':
        return {
          label: customLabel || 'PENDING',
          colorClasses: 'bg-telemetry-aqua/15 text-telemetry-aqua border-telemetry-aqua/50',
          dotColor: 'bg-telemetry-aqua shadow-neon-aqua animate-pulse',
          icon: <Clock className="w-3 h-3" />,
        };
      case 'online':
        return {
          label: customLabel || 'TELEMETRY LIVE',
          colorClasses: 'bg-[#B6FF3B]/10 text-[#4E8009] dark:text-[#B6FF3B] border-[#B6FF3B]/40',
          dotColor: 'bg-[#8ED91E] shadow-neon-lime animate-pulse',
          icon: <Radio className="w-3 h-3" />,
        };
      default:
        return {
          label: customLabel || String(status).toUpperCase(),
          colorClasses: 'bg-white/60 text-chrome-900 border-chrome-300',
          dotColor: 'bg-chrome-400',
          icon: <Sparkles className="w-3 h-3" />,
        };
    }
  };

  const { label, colorClasses, dotColor, icon } = getStatusConfig();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-mono font-bold tracking-wider border
        backdrop-blur-sm shadow-sm select-none transition-all
        ${colorClasses}
        ${sizeClasses}
      `}
    >
      {/* Pulsing Hardware LED Indicator */}
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
      
      {/* Visual Icon (Double Encoding for Colorblind Accessibility) */}
      <span className="flex items-center">{icon}</span>
      
      {/* Text Label */}
      <span className="leading-none">{label}</span>
    </span>
  );
};
