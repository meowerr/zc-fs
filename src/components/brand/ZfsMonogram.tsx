import React from 'react';
import { MONO_BODY_PATH, MONO_ACCENT_PATH } from './brandPaths';

export interface ZfsMonogramProps extends React.SVGProps<SVGSVGElement> {
  theme?: 'dark' | 'light' | 'auto';
  glow?: boolean;
  pulse?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaHidden?: boolean;
}

export const ZfsMonogram: React.FC<ZfsMonogramProps> = ({
  theme = 'auto',
  glow = true,
  pulse = false,
  className = '',
  ariaLabel = 'Zewail Formula Team Monogram',
  ariaHidden = false,
  ...props
}) => {
  const isLight = theme === 'light';
  const isDark = theme === 'dark';

  const bodyColor = isLight ? '#070B0E' : isDark ? '#F2F4F7' : 'var(--logo-body, #F2F4F7)';
  const accentColor = isLight ? '#C2410C' : isDark ? '#E07212' : 'var(--logo-accent, #E07212)';

  const a11yProps = ariaHidden
    ? { 'aria-hidden': true, role: 'presentation' as const }
    : { 'aria-label': ariaLabel, role: 'img' as const };

  const filterId = glow && !isLight ? 'zfs-mono-glow' : null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="90 10 1820 580"
      className={className}
      {...a11yProps}
      {...props}
    >
      {filterId && (
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="var(--logo-accent, #E07212)" floodOpacity="0.35" />
          </filter>
        </defs>
      )}
      <path
        fill={bodyColor}
        fillRule="evenodd"
        d={MONO_BODY_PATH}
      />
      <path
        fill={accentColor}
        fillRule="evenodd"
        d={MONO_ACCENT_PATH}
        filter={filterId ? `url(#${filterId})` : undefined}
        className={pulse ? 'animate-zfs-led-pulse' : undefined}
      />
    </svg>
  );
};

export default ZfsMonogram;
