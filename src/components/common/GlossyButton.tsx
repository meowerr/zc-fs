import React from 'react';

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
}

export const GlossyButton: React.FC<GlossyButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  chamfer = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'h-9 px-3.5 text-xs',
    md: 'min-h-[44px] h-10 px-4 text-xs sm:text-sm',
    lg: 'min-h-[48px] h-12 px-6 text-sm sm:text-base',
  };

  // Gracefully handle 'holo' as 'action'
  const activeVariant = variant === 'holo' ? 'action' : variant;

  const variantStyles = {
    primary: `
      bg-accent-cyan text-black font-bold
      border border-accent-cyan
      shadow-[0_2px_12px_rgba(0,217,255,0.25)]
      hover:brightness-110 hover:shadow-[0_2px_16px_rgba(0,217,255,0.4)]
      active:scale-[0.98]
    `,
    secondary: `
      bg-white dark:bg-[#181E26]
      text-[#0D1522] dark:text-[#F2F4F7]
      border border-[#D1DAE5] dark:border-[#39434F]
      hover:bg-[#F1F5F9] dark:hover:bg-[#202731]
      hover:border-[#9AA8BA] dark:hover:border-[#707986]
      shadow-sm dark:shadow-cyber-sm
      active:scale-[0.98]
    `,
    outline: `
      bg-transparent dark:bg-accent-cyan/5
      text-accent-cyan font-bold
      border border-accent-cyan/60
      hover:bg-accent-cyan/15 hover:border-accent-cyan
      hover:shadow-[0_0_12px_rgba(0,217,255,0.2)]
      active:scale-[0.98]
    `,
    action: `
      bg-accent-orange text-white font-bold
      border border-accent-orange
      shadow-[0_2px_12px_rgba(255,106,0,0.28)]
      hover:brightness-110 hover:shadow-[0_2px_16px_rgba(255,106,0,0.4)]
      active:scale-[0.98]
    `,
    warning: `
      bg-accent-yellow text-black font-bold
      border border-accent-yellow
      shadow-[0_2px_12px_rgba(255,212,59,0.25)]
      hover:brightness-110 hover:shadow-[0_2px_16px_rgba(255,212,59,0.38)]
      active:scale-[0.98]
    `,
    danger: `
      bg-accent-red text-white font-bold
      border border-accent-red
      shadow-[0_2px_12px_rgba(255,48,79,0.28)]
      hover:brightness-110 hover:shadow-[0_2px_16px_rgba(255,48,79,0.4)]
      active:scale-[0.98]
    `,
    metallic: `
      bg-gradient-to-b from-[#FFFFFF] to-[#E2E8F0] dark:from-[#2A3442] dark:to-[#161D26]
      text-[#0D1522] dark:text-[#F2F4F7] font-semibold
      border border-[#CBD5E1] dark:border-[#3E4C5E]
      hover:border-[#94A3B8] dark:hover:border-[#707986]
      hover:brightness-105
      shadow-sm dark:shadow-cyber-sm
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent text-cyber-secondary hover:text-cyber-primary
      hover:bg-cyber-surface-hover border border-transparent hover:border-cyber-border
      active:scale-[0.98]
    `,
  };

  const showTopSpecular = activeVariant !== 'ghost';

  return (
    <button
      className={`
        relative inline-flex items-center justify-center gap-2 
        select-none transition-all duration-150 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
        font-display tracking-wider uppercase font-bold
        ${chamfer ? 'tech-chamfer-sm rounded' : 'rounded-lg'}
        ${sizeStyles[size]}
        ${variantStyles[activeVariant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {/* Precision top edge specular highlight */}
      {showTopSpecular && (
        <span className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
      )}

      {icon && <span className="relative z-10 flex items-center shrink-0">{icon}</span>}
      <span className="relative z-10 flex items-center gap-2 truncate">
        {children}
      </span>
    </button>
  );
};
