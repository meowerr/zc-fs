import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'telemetry' | 'accent' | 'interactive';
  className?: string;
  hasShine?: boolean;
  cornerMark?: boolean;
  accentColor?: string;
  chamfer?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  className = '',
  hasShine = true,
  cornerMark = true,
  accentColor,
  chamfer = false,
  style,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-cyber-surface border-cyber-border text-cyber-primary shadow-cyber-sm',
    elevated: 'bg-cyber-surface-elevated border-cyber-border-strong text-cyber-primary shadow-cyber',
    telemetry: 'bg-cyber-bg-alt border-cyber-border text-cyber-primary shadow-cyber-sm',
    accent: 'bg-gradient-to-b from-cyber-surface to-cyber-surface-elevated border-cyber-border-strong text-cyber-primary shadow-cyber',
    interactive: 'bg-cyber-surface hover:bg-cyber-surface-hover border-cyber-border hover:border-accent-cyan/60 text-cyber-primary transition-all duration-200 cursor-pointer shadow-cyber-sm hover:shadow-cyber',
  };

  return (
    <div
      className={`
        relative overflow-hidden border transition-all duration-200
        ${chamfer ? 'tech-chamfer rounded-lg' : 'rounded-xl'}
        ${variantStyles[variant]} 
        ${className}
      `}
      style={{
        ...(accentColor ? { borderLeftColor: accentColor, borderLeftWidth: '3px' } : {}),
        ...style,
      }}
      {...props}
    >
      {/* Subtle top edge light reflection */}
      {hasShine && (
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent pointer-events-none" />
      )}
      
      {/* Technical corner registration mark */}
      {cornerMark && (
        <div className="absolute top-1.5 right-2 font-mono text-[9px] text-cyber-muted/40 select-none pointer-events-none tracking-widest">
          +
        </div>
      )}

      {children}
    </div>
  );
};
