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
          <label className="text-xs font-mono font-semibold tracking-wider text-chrome-900/80 dark:text-chrome-200 uppercase flex items-center justify-between">
            <span>{label}</span>
            {hint && <span className="text-[10px] text-chrome-900/50 dark:text-white/40 font-normal lowercase">{hint}</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3.5 text-chrome-900/40 dark:text-white/40 pointer-events-none">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={`
              w-full min-h-[44px] h-11 rounded-xl text-sm font-sans
              bg-white/70 dark:bg-midnight-950/60 
              text-chrome-900 dark:text-white
              placeholder:text-chrome-900/40 dark:placeholder:text-white/30
              border border-chrome-300 dark:border-white/15
              backdrop-blur-md shadow-inner
              transition-all duration-200
              ${icon ? 'pl-10 pr-4' : 'px-4'}
              focus:outline-none focus:border-telemetry-blue dark:focus:border-telemetry-aqua
              focus:ring-2 focus:ring-telemetry-blue/20 dark:focus:ring-telemetry-aqua/20
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-telemetry-red focus:border-telemetry-red focus:ring-telemetry-red/20' : ''}
              ${className}
            `}
            {...props}
          />
        </div>

        {error && (
          <span className="text-[11px] font-mono text-telemetry-red tracking-wide flex items-center gap-1">
            ⚠ {error}
          </span>
        )}
      </div>
    );
  }
);

GlowInput.displayName = 'GlowInput';
