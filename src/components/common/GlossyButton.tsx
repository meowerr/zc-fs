import React from 'react';

interface GlossyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'action' | 'warning' | 'holo' | 'ghost';
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
    sm: 'h-9 px-3.5 text-xs font-semibold',
    md: 'min-h-[44px] h-10 px-4.5 text-xs sm:text-sm font-semibold',
    lg: 'min-h-[48px] h-11 px-6 text-sm sm:text-base font-bold',
  };

  const variantStyles = {
    primary: `
      bg-accent-cyan text-black font-bold
      shadow-[0_2px_10px_rgba(0,217,255,0.25)]
      border border-accent-cyan/80
      hover:brightness-110 active:scale-[0.98]
    `,
    secondary: `
      bg-cyber-surface-elevated text-cyber-primary
      border border-cyber-border-strong
      hover:bg-cyber-surface-hover hover:border-cyber-chrome
      active:scale-[0.98] shadow-cyber-sm
    `,
    danger: `
      bg-accent-red text-white font-bold
      shadow-[0_2px_10px_rgba(255,48,79,0.25)]
      border border-accent-red/80
      hover:brightness-110 active:scale-[0.98]
    `,
    action: `
      bg-accent-orange text-white font-bold
      shadow-[0_2px_10px_rgba(255,106,0,0.25)]
      border border-accent-orange/80
      hover:brightness-110 active:scale-[0.98]
    `,
    warning: `
      bg-accent-yellow text-black font-bold
      shadow-[0_2px_10px_rgba(255,212,59,0.25)]
      border border-accent-yellow/80
      hover:brightness-110 active:scale-[0.98]
    `,
    holo: `
      bg-gradient-to-r from-accent-cyan via-accent-orange to-accent-red text-white font-bold
      shadow-[0_2px_12px_rgba(0,217,255,0.25)]
      border-t border-white/60 hover:brightness-110 active:scale-[0.98]
    `,
    ghost: `
      bg-transparent text-cyber-secondary hover:text-cyber-primary
      hover:bg-cyber-surface-hover border border-transparent hover:border-cyber-border
      active:scale-[0.98]
    `,
  };

  return (
    <button
      className={`
        relative inline-flex items-center justify-center gap-2 
        select-none transition-all duration-150 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
        ${chamfer ? 'tech-chamfer-sm rounded' : 'rounded-lg'}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {/* Subtle top edge light */}
      <span className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {icon && <span className="relative z-10 flex items-center">{icon}</span>}
      <span className="relative z-10 font-display tracking-wider flex items-center gap-2">
        {children}
      </span>
    </button>
  );
};
