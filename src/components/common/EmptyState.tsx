import React from 'react';
import { GlossyButton } from './GlossyButton';
import { Activity, CheckCircle2 } from 'lucide-react';
import { ZfsMonogram } from '../brand/ZfsMonogram';

interface EmptyStateProps {
  illustration?: 'wheel' | 'helmet' | 'telemetry' | 'check' | 'brand';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  illustration = 'telemetry',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  const renderIllustration = () => {
    if (illustration === 'brand') {
      return (
        <div className="w-12 h-auto mx-auto p-1.5 rounded-lg bg-cyber-surface-elevated border border-cyber-border">
          <ZfsMonogram glow={false} className="w-full h-auto opacity-85" />
        </div>
      );
    }

    if (illustration === 'helmet') {
      return (
        <svg viewBox="0 0 100 100" className="w-14 h-14 mx-auto text-accent-cyan" fill="none">
          {/* Driver Racing Helmet */}
          <path
            d="M50 16 C30 16 20 32 20 54 C20 70 28 82 50 82 C72 82 80 70 80 54 C80 32 70 16 50 16 Z"
            fill="currentColor"
            fillOpacity="0.08"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          {/* Visor */}
          <path
            d="M30 46 C42 42 58 42 70 46 C72 52 70 58 50 58 C30 58 28 52 30 46 Z"
            fill="var(--cyber-surface-elevated)"
            stroke="var(--accent-cyan)"
            strokeWidth="2"
          />
          <path d="M35 48 Q50 45 65 48" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
    }

    if (illustration === 'wheel') {
      return (
        <svg viewBox="0 0 100 100" className="w-14 h-14 mx-auto text-cyber-muted" fill="none">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="4" strokeOpacity="0.6" />
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.4" />
          <line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
          <line x1="20" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
          <circle cx="50" cy="50" r="8" fill="var(--cyber-surface-elevated)" stroke="var(--accent-cyan)" strokeWidth="2" />
        </svg>
      );
    }

    if (illustration === 'check') {
      return (
        <div className="w-12 h-12 mx-auto rounded-lg bg-accent-lime/10 border border-accent-lime/30 flex items-center justify-center text-accent-lime">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      );
    }

    // Default: Telemetry Radar / Inactive Sensor
    return (
      <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-lg border border-cyber-border bg-cyber-surface-elevated" />
        <div className="absolute inset-2 rounded border border-cyber-border-strong border-dashed" />
        <Activity className="w-6 h-6 text-accent-cyan opacity-80" />
      </div>
    );
  };

  return (
    <div className={`p-8 text-center space-y-3 rounded-xl border border-cyber-border bg-cyber-surface/60 ${className}`}>
      {/* Decorative Technical Header */}
      <div className="flex items-center justify-center gap-2 font-mono text-label text-cyber-muted uppercase">
        <span>[</span>
        <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
        <span>TELEMETRY STANDBY</span>
        <span>]</span>
      </div>

      <div className="my-3">
        {renderIllustration()}
      </div>

      <div>
        <h4 className="font-sans font-semibold text-base text-cyber-primary">
          {title}
        </h4>
        <p className="text-sm font-sans text-cyber-secondary max-w-sm mx-auto mt-1 leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <GlossyButton variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </GlossyButton>
        </div>
      )}
    </div>
  );
};
