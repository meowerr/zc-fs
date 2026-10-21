import React from 'react';

export interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
  stats?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  eyebrow,
  description,
  actions,
  stats,
}) => (
  <header className={stats ? 'mb-3 md:mb-6' : 'hidden md:block mb-6'}>
    {eyebrow && (
      <p className="hidden md:block text-label font-mono uppercase text-accent-cyan mb-1">
        {eyebrow}
      </p>
    )}
    <div className="hidden md:flex items-center justify-between gap-3">
      <h1 className="font-display font-black text-xl md:text-3xl uppercase tracking-wide text-cyber-primary truncate">
        {title}
      </h1>
      <div className="hidden sm:flex items-center gap-2 shrink-0">{actions}</div>
    </div>
    {description && (
      <p className="hidden md:block mt-2 text-sm text-cyber-secondary max-w-2xl leading-relaxed">
        {description}
      </p>
    )}
    {stats && <div className="mt-3">{stats}</div>}
  </header>
);
