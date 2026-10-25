import React from 'react';
import { Loader2 } from 'lucide-react';

export interface GlossyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?:
    | 'primary'   // High-emphasis Electric Cyan (Submit, Confirm, Launch)
    | 'secondary' // Elevated graphite / clean surface (Cancel, Close, Specs)
    | 'outline'   // Technical wireframe Electric Cyan (Telemetry, Inspect, Export)
    | 'action'    // Racing Orange energetic action (Submit Work, Execute, Approve)
    | 'warning'   // Racing Yellow caution / review (Request Changes, Hold)
    | 'danger'    // Racing Red destructive (Delete, Reject, Abort)
    | 'metallic'  // Machined alloy cockpit switchgear (Hardware, Settings)
    | 'ghost'     // Minimal chrome (Toolbars, inline actions)
    | 'holo';     // Legacy alias -> mapped to action
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
  chamfer?: boolean;
  loading?: boolean;
}

const sizeStyles = {
  sm: 'h-10 sm:h-9 px-3.5 text-xs',
  md: 'h-11 sm:h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-sm sm:text-base',
};

const solid = 'text-on-accent border shadow-cyber-sm hover:brightness-110 hover:shadow-cyber';

const variantStyles = {
  primary: `bg-accent-cyan border-accent-cyan ${solid}`,
  action: `bg-accent-orange border-accent-orange ${solid}`,
  warning: `bg-accent-yellow border-accent-yellow ${solid}`,
  danger: `bg-accent-red border-accent-red ${solid}`,
  secondary: `
    bg-cyber-surface-elevated text-cyber-primary
    border border-cyber-border hover:border-cyber-border-strong hover:bg-cyber-surface-hover
    shadow-cyber-sm
  `,
  outline: `
    bg-transparent text-accent-cyan
    border border-accent-cyan/60 hover:border-accent-cyan hover:bg-accent-cyan/10
  `,
  metallic: `
    bg-gradient-to-b from-white to-slate-200 dark:from-[#2A3442] dark:to-[#161D26]
    text-cyber-primary border border-cyber-border-strong hover:brightness-105
    shadow-cyber-sm
  `,
  ghost: `
    bg-transparent text-cyber-secondary hover:text-cyber-primary
    hover:bg-cyber-surface-hover border border-transparent
  `,
};

export const GlossyButton: React.FC<GlossyButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  chamfer = false,
  loading = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const activeVariant = variant === 'holo' ? 'action' : variant;

  return (
    <button
      type={type}
      className={`
        relative inline-flex items-center justify-center gap-2 shrink-0
        select-none cursor-pointer whitespace-nowrap
        font-sans font-bold uppercase tracking-wider
        transition-[background-color,border-color,box-shadow,filter,transform] duration-fast ease-out
        active:scale-[0.98]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-cyber-bg
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:brightness-100
        ${chamfer ? 'tech-chamfer-sm rounded' : 'rounded-lg'}
        ${sizeStyles[size]}
        ${variantStyles[activeVariant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        icon && <span className="flex items-center shrink-0" aria-hidden="true">{icon}</span>
      )}
      <span className="flex items-center gap-2 truncate">{children}</span>
    </button>
  );
};
