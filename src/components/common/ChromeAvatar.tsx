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
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-20 h-20 text-lg',
  };

  const roleBadgeStyles: Record<UserRole, string> = {
    admin: 'bg-gradient-to-r from-telemetry-pink to-telemetry-blue border-white text-white',
    head: 'bg-telemetry-blue border-white text-white',
    member: 'bg-[#8ED91E] border-white text-midnight-900',
    pending: 'bg-telemetry-amber border-white text-midnight-900',
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
      {/* Chrome Bezel Outer Ring */}
      <div
        className={`
          ${sizeStyles[size]} rounded-full p-[2.5px] 
          bg-gradient-to-b from-white via-[#CBD5E1] to-[#94A3B8] 
          dark:from-[#475569] dark:via-[#1E293B] dark:to-[#0F172A] 
          shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center
        `}
      >
        {/* Avatar Inner Core */}
        <div className="w-full h-full rounded-full overflow-hidden bg-chrome-200 dark:bg-midnight-800 flex items-center justify-center font-display font-bold text-chrome-900 dark:text-chrome-100 select-none">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span>{getInitials(name)}</span>
          )}
        </div>
      </div>

      {/* Role Indicator Dot / Micro Badge */}
      {role && (
        <span
          title={`Role: ${role.toUpperCase()}`}
          className={`
            absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 
            ${roleBadgeStyles[role]} shadow-sm flex items-center justify-center font-mono text-[7px] font-bold
          `}
        >
          {role[0].toUpperCase()}
        </span>
      )}
    </div>
  );
};
