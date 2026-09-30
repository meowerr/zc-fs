import React from 'react';

interface SegmentedGaugeProps {
  value: number; // 0 to 100
  totalSegments?: number;
  label?: string;
  className?: string;
  showPercent?: boolean;
}

export const SegmentedGauge: React.FC<SegmentedGaugeProps> = ({
  value,
  totalSegments = 8,
  label,
  className = '',
  showPercent = true,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const activeSegments = Math.round((clampedValue / 100) * totalSegments);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs font-mono">
          {label && (
            <span className="text-chrome-900/70 dark:text-chrome-300 uppercase tracking-wider font-semibold">
              {label}
            </span>
          )}
          {showPercent && (
            <span className="text-telemetry-blue dark:text-telemetry-aqua font-bold">
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}

      {/* Segmented Bar Track */}
      <div className="flex items-center gap-1 p-1 bg-black/10 dark:bg-black/40 rounded-lg border border-chrome-300/60 dark:border-white/10 backdrop-blur-sm">
        {Array.from({ length: totalSegments }).map((_, index) => {
          const isActive = index < activeSegments;
          const isHighest = index === activeSegments - 1 && isActive;

          // Color ramp based on segment depth
          let activeColor = 'bg-telemetry-blue shadow-neon-blue';
          if (index >= totalSegments * 0.75) {
            activeColor = 'bg-[#8ED91E] shadow-neon-lime'; // Final stretch lime
          } else if (index >= totalSegments * 0.45) {
            activeColor = 'bg-telemetry-aqua shadow-neon-aqua';
          }

          return (
            <div
              key={index}
              className={`
                h-2.5 flex-1 rounded-[3px] transition-all duration-300
                ${
                  isActive
                    ? `${activeColor} ${isHighest ? 'brightness-125' : 'opacity-90'}`
                    : 'bg-white/20 dark:bg-white/5 border border-black/5 dark:border-white/5'
                }
              `}
            />
          );
        })}
      </div>
    </div>
  );
};
