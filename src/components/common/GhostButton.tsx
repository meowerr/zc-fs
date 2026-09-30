import React from 'react';

interface GhostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const GhostButton: React.FC<GhostButtonProps> = ({
  children,
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'h-9 px-3 text-xs',
    md: 'min-h-[44px] h-10 px-4 text-sm',
    lg: 'min-h-[48px] h-12 px-6 text-base',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-full font-display tracking-wider
        bg-transparent text-chrome-900/80 dark:text-white/80 
        hover:bg-white/40 dark:hover:bg-white/10 hover:text-telemetry-blue dark:hover:text-telemetry-aqua
        border border-transparent hover:border-chrome-300 dark:hover:border-white/20
        transition-all duration-200 active:scale-[0.98] disabled:opacity-40
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
