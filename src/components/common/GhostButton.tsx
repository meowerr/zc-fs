import React from 'react';

interface GhostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  active?: boolean;
}

export const GhostButton: React.FC<GhostButtonProps> = ({
  children,
  size = 'md',
  icon,
  active = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'h-8 px-2.5 text-xs',
    md: 'min-h-[44px] h-9 px-3.5 text-xs sm:text-sm',
    lg: 'min-h-[48px] h-11 px-5 text-sm sm:text-base',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-mono tracking-wider
        transition-all duration-150 active:scale-[0.98] disabled:opacity-40 cursor-pointer
        ${
          active
            ? 'bg-cyber-surface-hover text-accent-cyan border border-accent-cyan/40 shadow-cyber-sm'
            : 'bg-transparent text-cyber-secondary hover:text-cyber-primary hover:bg-cyber-surface-hover border border-transparent hover:border-cyber-border'
        }
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
