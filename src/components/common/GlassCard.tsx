import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'telemetry' | 'accent';
  className?: string;
  hasShine?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  className = '',
  hasShine = true,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white/75 dark:bg-midnight-850/65 border-chrome-300/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark',
    elevated: 'bg-white/90 dark:bg-midnight-800/80 border-chrome-300 dark:border-white/20 shadow-xl',
    telemetry: 'bg-chrome-50/80 dark:bg-midnight-950/80 border-telemetry-blue/30 dark:border-telemetry-blue/40 shadow-neon-blue/10',
    accent: 'bg-gradient-to-br from-white/80 via-chrome-100/60 to-white/70 dark:from-midnight-800/80 dark:to-midnight-900/80 border-telemetry-aqua/40',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl backdrop-blur-md border transition-all duration-300 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {/* Subtle Y2K top chrome reflection highlight */}
      {hasShine && (
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/30 to-transparent pointer-events-none" />
      )}
      
      {/* Technical corner registration mark */}
      <div className="absolute top-1 right-2 font-mono text-[9px] text-chrome-900/20 dark:text-white/20 select-none pointer-events-none tracking-widest">
        +
      </div>

      {children}
    </div>
  );
};
