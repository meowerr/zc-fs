import React from 'react';

interface SegmentedGaugeProps {
  value: number; // 0 to 100
  totalSegments?: number;
  label?: string;
  className?: string;
  showPercent?: boolean;
  accentColor?: string;
}

export const SegmentedGauge: React.FC<SegmentedGaugeProps> = ({
  value,
  totalSegments = 8,
  label,
  className = '',
  showPercent = true,
  accentColor,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const activeSegments = Math.round((clampedValue / 100) * totalSegments);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs font-mono">
          {label && (
            <span className="text-cyber-secondary uppercase tracking-wider text-[11px]">
              {label}
            </span>
          )}
          {showPercent && (
            <span 
              className="font-bold text-xs" 
              style={{ color: accentColor || 'var(--accent-cyan)' }}
            >
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}

      {/* Segmented Bar Track */}
      <div className="flex items-center gap-1 p-0.5 bg-cyber-bg-alt rounded border border-cyber-border">
        {Array.from({ length: totalSegments }).map((_, index) => {
          const isActive = index < activeSegments;

          // Default ramp if no accentColor provided
          let defaultBg = 'var(--accent-cyan)';
          if (index >= totalSegments * 0.75) {
            defaultBg = 'var(--accent-lime)';
          } else if (index >= totalSegments * 0.45) {
            defaultBg = 'var(--accent-orange)';
          }

          const fillBg = accentColor || defaultBg;

          return (
            <div
              key={index}
              className={`
                h-2 flex-1 rounded-[2px] transition-all duration-200
                ${
                  isActive
                    ? 'opacity-100 shadow-[0_0_4px_rgba(0,0,0,0.3)]'
                    : 'bg-cyber-surface-hover/60 border border-cyber-border/40'
                }
              `}
              style={isActive ? { backgroundColor: fillBg } : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};
