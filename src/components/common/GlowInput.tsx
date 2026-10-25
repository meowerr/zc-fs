import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';

interface GlowInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const GlowInput = React.forwardRef<HTMLInputElement, GlowInputProps>(
  ({ label, error, hint, icon, trailing, className = '', disabled, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [hintId, errorId, props['aria-describedby']].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={inputId} className="text-xs font-semibold tracking-wide text-cyber-secondary uppercase">
              {label}
            </label>
            {hint && (
              <span id={hintId} className="text-2xs font-mono text-cyber-muted">
                {hint}
              </span>
            )}
          </div>
        )}

        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 text-cyber-muted pointer-events-none flex items-center" aria-hidden="true">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`
              w-full h-11 rounded-lg text-sm font-sans
              ${icon ? 'pl-10' : 'pl-3.5'} ${trailing ? 'pr-11' : 'pr-3.5'}
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />

          {trailing && <span className="absolute right-1.5 flex items-center">{trailing}</span>}
        </div>

        {error && (
          <span id={errorId} role="alert" className="text-xs text-accent-red flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            {error}
          </span>
        )}
      </div>
    );
  }
);

GlowInput.displayName = 'GlowInput';
