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
    className={`-mx-3.5 px-3.5 flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-3 ${className}`}
  >
    {items.map((s) => {
      const isZero = s.value === 0 || s.value === '0' || s.value === '00';
      const hideMobile = s.hideZeroOnMobile && isZero;
      const toneCls = s.tone ? TONE_CLASSES[s.tone] || '' : '';

      return (
        <div
          key={s.label}
          className={`snap-start shrink-0 min-w-[104px] sm:min-w-0 rounded-xl border border-cyber-border bg-cyber-surface-elevated px-3 py-2 ${
            hideMobile ? 'hidden sm:block' : ''
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
