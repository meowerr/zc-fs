import React from 'react';

interface GhostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  active?: boolean;
}

const sizeStyles = {
  sm: 'h-10 sm:h-8 px-2.5 text-xs',
  md: 'h-11 sm:h-9 px-3.5 text-xs sm:text-sm',
  lg: 'h-12 sm:h-11 px-5 text-sm sm:text-base',
};

export const GhostButton: React.FC<GhostButtonProps> = ({
  children,
  size = 'md',
  icon,
  active = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center gap-1.5 rounded-lg font-mono tracking-wide uppercase whitespace-nowrap
        border transition-colors duration-fast ease-out active:scale-[0.98] cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan
        disabled:opacity-50 disabled:cursor-not-allowed
        ${
          active
            ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/40'
            : 'bg-transparent text-cyber-secondary border-transparent hover:text-cyber-primary hover:bg-cyber-surface-hover hover:border-cyber-border'
        }
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex items-center" aria-hidden="true">{icon}</span>}
      <span className="flex items-center">{children}</span>
    </button>
  );
};
