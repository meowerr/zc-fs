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
              <span className="text-accent-cyan opacity-80 font-bold">//</span>
              {label}
            </span>
            {hint && <span className="text-[10px] font-mono text-cyber-muted">{hint}</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 text-cyber-muted pointer-events-none flex items-center">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={`
              w-full min-h-[44px] h-10 rounded-lg text-xs sm:text-sm font-sans
              bg-white dark:bg-[#181E26]
              text-[#0D1522] dark:text-[#F2F4F7]
              placeholder:text-[#94A3B8] dark:placeholder:text-[#737D89]
              border border-[#D1DAE5] dark:border-[#2A323C]
              transition-all duration-150
              ${icon ? 'pl-9 pr-3.5' : 'px-3.5'}
              focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/40
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
