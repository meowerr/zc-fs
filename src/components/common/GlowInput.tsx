import React from 'react';

interface GlowInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const GlowInput = React.forwardRef<HTMLInputElement, GlowInputProps>(
  ({ label, error, hint, icon, className = '', disabled, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-mono font-medium tracking-wider text-cyber-secondary uppercase flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="text-accent-cyan opacity-70">//</span>
              {label}
            </span>
            {hint && <span className="text-[10px] text-cyber-muted lowercase">{hint}</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 text-cyber-muted pointer-events-none">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={`
              w-full min-h-[44px] h-10 rounded-lg text-sm font-sans
              bg-cyber-surface-elevated text-cyber-primary
              placeholder:text-cyber-muted
              border border-cyber-border
              transition-all duration-150
              ${icon ? 'pl-9 pr-3.5' : 'px-3.5'}
              focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/30
              disabled:opacity-40 disabled:cursor-not-allowed
              ${error ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/30' : ''}
              ${className}
            `}
            {...props}
          />
        </div>

        {error && (
          <span className="text-[11px] font-mono text-accent-red tracking-wide flex items-center gap-1">
            ⚠ {error}
          </span>
        )}
      </div>
    );
  }
);

GlowInput.displayName = 'GlowInput';
