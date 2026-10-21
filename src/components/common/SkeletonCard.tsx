import React from 'react';

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading content">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="rounded-xl border border-cyber-border bg-cyber-surface p-4 space-y-3 relative overflow-hidden"
        aria-hidden="true"
      >
        <div className="h-4 w-2/3 rounded bg-cyber-surface-hover" />
        <div className="h-3 w-full rounded bg-cyber-surface-hover" />
        <div className="h-3 w-1/2 rounded bg-cyber-surface-hover" />
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>
    ))}
  </div>
);
