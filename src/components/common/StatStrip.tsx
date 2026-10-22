import React from 'react';

export interface StatItem {
  label: string;
  value: number | string;
  tone?: 'cyan' | 'yellow' | 'red' | 'lime';
  hideZeroOnMobile?: boolean;
}

const TONE_CLASSES: Record<string, string> = {
  cyan: 'text-accent-cyan',
  yellow: 'text-accent-yellow',
  red: 'text-accent-red',
  lime: 'text-accent-lime',
};

export const StatStrip: React.FC<{ items: StatItem[]; className?: string }> = ({
  items,
  className = '',
}) => (
  <div
    className={`grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4 ${className}`}
  >
    {items.map((s, idx) => {
      const isZero = s.value === 0 || s.value === '0' || s.value === '00';
      const toneCls = s.tone ? TONE_CLASSES[s.tone] || '' : '';
      const isOddLast = items.length === 3 && idx === 2;

      return (
        <div
          key={s.label}
          className={`min-w-0 rounded-xl border border-cyber-border bg-cyber-surface-elevated px-3 py-2.5 ${
            isOddLast ? 'col-span-2 sm:col-span-1' : ''
          }`}
        >
          <div
            className={`font-display font-black text-2xl leading-none ${
              isZero ? 'text-cyber-muted font-mono font-medium' : toneCls || 'text-cyber-primary'
            }`}
          >
            {s.value}
          </div>
          <div className="mt-1 text-label font-sans text-cyber-secondary truncate font-medium">
            {s.label}
          </div>
        </div>
      );
    })}
  </div>
);
