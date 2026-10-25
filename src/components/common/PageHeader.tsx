import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, description, actions, children }) => (
  <header className="space-y-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5 min-w-0">
        {eyebrow && (
          <p className="micro-label flex items-center gap-2">
            <span className="w-4 h-px bg-accent-cyan" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h1 className="font-display font-black text-xl sm:text-2xl lg:text-[1.75rem] leading-tight text-cyber-primary tracking-wide">
          {title}
        </h1>
        {description && <p className="text-sm text-cyber-secondary max-w-2xl leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
    {children}
  </header>
);

type Tone = 'cyan' | 'orange' | 'yellow' | 'lime' | 'red' | 'neutral';

const toneClasses: Record<Tone, { text: string; bar: string; ring: string }> = {
  cyan: { text: 'text-accent-cyan', bar: 'bg-accent-cyan', ring: 'hover:border-accent-cyan/50' },
  orange: { text: 'text-accent-orange', bar: 'bg-accent-orange', ring: 'hover:border-accent-orange/50' },
  yellow: { text: 'text-accent-yellow', bar: 'bg-accent-yellow', ring: 'hover:border-accent-yellow/50' },
  lime: { text: 'text-accent-lime', bar: 'bg-accent-lime', ring: 'hover:border-accent-lime/50' },
  red: { text: 'text-accent-red', bar: 'bg-accent-red', ring: 'hover:border-accent-red/50' },
  neutral: { text: 'text-cyber-primary', bar: 'bg-cyber-border-strong', ring: 'hover:border-cyber-border-strong' },
};

interface StatTileProps {
  label: string;
  value: number | string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: Tone;
  onClick?: () => void;
  active?: boolean;
}

export const StatTile: React.FC<StatTileProps> = ({ label, value, hint, icon, tone = 'neutral', onClick, active }) => {
  const t = toneClasses[tone];
  const content = (
    <>
      <span className={`absolute top-0 inset-x-0 h-0.5 ${t.bar}`} aria-hidden="true" />
      <span className="flex items-center justify-between gap-2 text-xs font-medium text-cyber-secondary">
        <span>{label}</span>
        {icon && <span className={t.text} aria-hidden="true">{icon}</span>}
      </span>
      <span className={`block mt-1.5 font-display font-black text-2xl sm:text-3xl tabular-nums ${t.text}`}>{value}</span>
      {hint && <span className="block mt-0.5 text-2xs text-cyber-muted">{hint}</span>}
    </>
  );

  const base = `relative overflow-hidden text-left p-3.5 sm:p-4 rounded-xl bg-cyber-surface border transition-colors duration-fast ${
    active ? 'border-accent-cyan' : 'border-cyber-border'
  }`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={`${base} ${t.ring} cursor-pointer w-full`}>
        {content}
      </button>
    );
  }

  return <div className={base}>{content}</div>;
};
