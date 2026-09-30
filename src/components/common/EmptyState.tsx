import React from 'react';
import { GlossyButton } from './GlossyButton';

interface EmptyStateProps {
  illustration?: 'wheel' | 'helmet' | 'star';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  illustration = 'wheel',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  const renderIllustration = () => {
    if (illustration === 'helmet') {
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto drop-shadow-md text-telemetry-blue" fill="none">
          {/* Driver Racing Helmet */}
          <path
            d="M50 15 C28 15 18 32 18 55 C18 72 26 84 50 84 C74 84 82 72 82 55 C82 32 72 15 50 15 Z"
            fill="currentColor"
            fillOpacity="0.1"
            stroke="currentColor"
            strokeWidth="3.5"
          />
          {/* Tinted Visor */}
          <path
            d="M30 45 C42 40 58 40 70 45 C73 52 70 60 50 60 C30 60 27 52 30 45 Z"
            fill="url(#visorGradient)"
            stroke="#22E4F0"
            strokeWidth="2.5"
          />
          {/* Chrome reflection line */}
          <path d="M35 48 Q50 44 65 48" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          <defs>
            <linearGradient id="visorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#2F6BFF" />
              <stop offset="100%" stop-color="#22E4F0" />
            </linearGradient>
          </defs>
        </svg>
      );
    }

    if (illustration === 'star') {
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto drop-shadow-md text-telemetry-pink" fill="none">
          {/* 4-point Y2K Cyber Star */}
          <path
            d="M50 10 Q50 50 10 50 Q50 50 50 90 Q50 50 90 50 Q50 50 50 10 Z"
            fill="url(#starGradient)"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <circle cx="50" cy="50" r="6" fill="#FFFFFF" />
          <defs>
            <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FF4FA3" />
              <stop offset="50%" stop-color="#22E4F0" />
              <stop offset="100%" stop-color="#B892FF" />
            </linearGradient>
          </defs>
        </svg>
      );
    }

    // Default: Formula Student Center-lock Racing Wheel
    return (
      <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto drop-shadow-md text-telemetry-aqua" fill="none">
        {/* Outer Tire */}
        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" strokeOpacity="0.8" />
        <circle cx="50" cy="50" r="32" stroke="#A5C4F0" strokeWidth="2" strokeDasharray="6 3" />
        {/* Rim Spokes */}
        <line x1="50" y1="18" x2="50" y2="82" stroke="currentColor" strokeWidth="3" />
        <line x1="18" y1="50" x2="82" y2="50" stroke="currentColor" strokeWidth="3" />
        <line x1="27" y1="27" x2="73" y2="73" stroke="currentColor" strokeWidth="2.5" />
        <line x1="73" y1="27" x2="27" y2="73" stroke="currentColor" strokeWidth="2.5" />
        {/* Center Nut */}
        <circle cx="50" cy="50" r="10" fill="#2F6BFF" stroke="#FFFFFF" strokeWidth="2" />
        <circle cx="50" cy="50" r="4" fill="#B6FF3B" />
      </svg>
    );
  };

  return (
    <div className={`py-12 px-4 text-center space-y-3 ${className}`}>
      <div className="mb-2 animate-bounce" style={{ animationDuration: '3s' }}>
        {renderIllustration()}
      </div>

      <h4 className="font-display font-bold text-base text-chrome-900 dark:text-white uppercase tracking-wider">
        {title}
      </h4>

      <p className="text-xs font-sans text-chrome-900/60 dark:text-white/50 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="pt-3">
          <GlossyButton size="sm" variant="holo" onClick={onAction}>
            {actionLabel}
          </GlossyButton>
        </div>
      )}
    </div>
  );
};
