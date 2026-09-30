import React from 'react';
import { UserRole } from '../../lib/database.types';

interface ChromeAvatarProps {
  name: string;
  avatarUrl?: string | null;
  role?: UserRole;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ChromeAvatar: React.FC<ChromeAvatarProps> = ({
  name,
  avatarUrl,
  role = 'member',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-base',
  };

  const roleBadgeStyles: Record<UserRole, string> = {
    admin: 'bg-accent-red border-cyber-bg text-white',
    head: 'bg-accent-cyan border-cyber-bg text-black',
    member: 'bg-accent-lime border-cyber-bg text-black',
    pending: 'bg-accent-yellow border-cyber-bg text-black',
  };

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Cyber Technical Bezel Outer Ring */}
      <div
        className={`
          ${sizeStyles[size]} rounded-lg p-[1.5px] 
          bg-cyber-border-strong border border-white/10
          shadow-cyber-sm flex items-center justify-center
        `}
      >
        {/* Avatar Inner Core */}
        <div className="w-full h-full rounded-[6px] overflow-hidden bg-cyber-surface-elevated flex items-center justify-center font-mono font-bold text-cyber-primary select-none">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span>{getInitials(name)}</span>
          )}
        </div>
      </div>

      {/* Role Indicator Micro Badge */}
      {role && (
        <span
          title={`Role: ${role.toUpperCase()}`}
          className={`
            absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded border 
            ${roleBadgeStyles[role]} shadow-sm flex items-center justify-center font-mono text-[8px] font-bold leading-none
          `}
        >
          {role[0].toUpperCase()}
        </span>
      )}
    </div>
  );
};
