import React from 'react';
import {
  MONO_BODY_PATH,
  MONO_ACCENT_PATH,
  FULL_BODY_PATH,
  FULL_ACCENT_PATH,
} from './brandPaths';

export type ZfsLogoVariant = 'full' | 'horizontal' | 'monogram';
export type ZfsLogoTheme = 'dark' | 'light' | 'auto';

export interface ZfsLogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: ZfsLogoVariant;
  theme?: ZfsLogoTheme;
  glow?: boolean;
  animated?: boolean;
  pulse?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaHidden?: boolean;
}

export const ZfsLogo: React.FC<ZfsLogoProps> = ({
  variant = 'full',
  theme = 'auto',
  glow = true,
  animated = false,
  pulse = false,
  className = '',
  ariaLabel = 'Zewail Formula Team',
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

  let viewBox = '0 0 2000 1068';
  let bodyPath = FULL_BODY_PATH;
  let accentPath = FULL_ACCENT_PATH;
  const filterId: string | null = glow && !isLight ? 'zfs-glow' : null;

  if (variant === 'monogram') {
    viewBox = '90 10 1820 580';
    bodyPath = MONO_BODY_PATH;
    accentPath = MONO_ACCENT_PATH;
  } else if (variant === 'horizontal') {
    viewBox = '0 0 2000 918';
    bodyPath = FULL_BODY_PATH;
    accentPath = MONO_ACCENT_PATH;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
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
        d={bodyPath}
        className={animated ? 'animate-zfs-draw' : undefined}
      />
      <path
        fill={accentColor}
        fillRule="evenodd"
        d={accentPath}
        filter={filterId ? `url(#${filterId})` : undefined}
        className={pulse ? 'animate-zfs-led-pulse' : (animated ? 'animate-zfs-ignite' : undefined)}
      />
    </svg>
  );
};

export default ZfsLogo;
