import React from 'react';

interface GlossyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'holo' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const GlossyButton: React.FC<GlossyButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'h-10 px-4 text-xs font-semibold rounded-full',
    md: 'min-h-[44px] h-11 px-5 text-sm font-semibold rounded-full',
    lg: 'min-h-[48px] h-12 px-6 text-base font-bold rounded-full',
  };

  const variantStyles = {
    primary: `
      bg-gradient-to-b from-telemetry-blue to-[#1F50C9] text-white 
      shadow-[0_4px_14px_rgba(47,107,255,0.4)] 
      border-t border-white/50 hover:brightness-110 active:scale-[0.98]
    `,
    holo: `
      bg-gradient-to-r from-telemetry-pink via-telemetry-aqua to-[#B892FF] text-white 
      shadow-[0_4px_16px_rgba(255,79,163,0.35)] 
      border-t border-white/60 hover:brightness-110 active:scale-[0.98]
    `,
    secondary: `
      bg-white/80 dark:bg-midnight-800/80 text-chrome-900 dark:text-white 
      border border-chrome-300 dark:border-white/20 
      hover:bg-white dark:hover:bg-midnight-700 active:scale-[0.98] shadow-sm
    `,
    danger: `
      bg-gradient-to-b from-telemetry-red to-[#C92A2A] text-white 
      shadow-[0_4px_14px_rgba(255,77,77,0.35)] 
      border-t border-white/40 hover:brightness-110 active:scale-[0.98]
    `,
    success: `
      bg-gradient-to-b from-[#8ED91E] to-[#6AA812] text-midnight-900 
      shadow-[0_4px_14px_rgba(182,255,59,0.35)] 
      border-t border-white/60 hover:brightness-105 active:scale-[0.98] font-bold
    `,
  };

  return (
    <button
      className={`
        relative inline-flex items-center justify-center gap-2 
        select-none transition-all duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {/* Top Gloss Highlight Bubble */}
      <span className="absolute inset-x-3 top-[1px] h-[40%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />

      {icon && <span className="relative z-10 flex items-center">{icon}</span>}
      <span className="relative z-10 font-display tracking-wider flex items-center gap-2">
        {children}
      </span>
    </button>
  );
};
