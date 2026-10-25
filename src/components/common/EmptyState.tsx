import React from 'react';
import { Activity, CheckCircle2, SearchX, HardHat } from 'lucide-react';
import { GlossyButton } from './GlossyButton';

interface EmptyStateProps {
  illustration?: 'wheel' | 'helmet' | 'telemetry' | 'check';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

const illustrationConfig = {
  telemetry: { Icon: Activity, tone: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/25' },
  wheel: { Icon: SearchX, tone: 'text-cyber-secondary bg-cyber-surface-elevated border-cyber-border' },
  helmet: { Icon: HardHat, tone: 'text-accent-orange bg-accent-orange/10 border-accent-orange/25' },
  check: { Icon: CheckCircle2, tone: 'text-accent-lime bg-accent-lime/10 border-accent-lime/25' },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  illustration = 'telemetry',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  const { Icon, tone } = illustrationConfig[illustration];

  return (
    <div
      className={`px-6 py-10 sm:py-12 text-center flex flex-col items-center gap-3 rounded-xl border border-dashed border-cyber-border bg-cyber-surface/60 ${className}`}
    >
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${tone}`} aria-hidden="true">
        <Icon className="w-6 h-6" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h4 className="font-display font-bold text-sm sm:text-base text-cyber-primary tracking-wide">
          {title}
        </h4>
        <p className="text-sm text-cyber-secondary leading-relaxed">{description}</p>
      </div>

      {((actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction)) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {actionLabel && onAction && (
            <GlossyButton variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </GlossyButton>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <GlossyButton variant="secondary" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </GlossyButton>
          )}
        </div>
      )}
    </div>
  );
};
