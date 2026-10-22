/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        xs: '420px',
      },
      fontSize: {
        label: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.04em' }], // 12px floor
        body: ['0.875rem', { lineHeight: '1.25rem' }],                       // 14px
        'body-lg': ['1rem', { lineHeight: '1.5rem' }],                       // 16px
      },
      colors: {
        'text-muted': 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',
        cyber: {
          bg: 'var(--bg-base)',
          'bg-alt': 'var(--bg-alt)',
          surface: 'var(--surface-base)',
          'surface-elevated': 'var(--surface-elevated)',
          'surface-hover': 'var(--surface-hover)',
          border: 'var(--border-subtle)',
          'border-strong': 'var(--border-strong)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          chrome: 'var(--chrome)',
          'chrome-dark': 'var(--chrome-dark)',
        },
        accent: {
          cyan: 'var(--accent-cyan)',
          red: 'var(--accent-red)',
          orange: 'var(--accent-orange)',
          yellow: 'var(--accent-yellow)',
          lime: 'var(--accent-lime)',
          purple: 'var(--accent-purple)',
        },
        team: {
          vd: 'var(--team-vd)',
          aero: 'var(--team-aero)',
          elec: 'var(--team-elec)',
          pt: 'var(--team-pt)',
          ops: 'var(--team-ops)',
        },
        chrome: {
          50: '#F8FBFF',
          100: '#EAF4FF',
          200: '#D5E6FC',
          300: '#C9D6E8',
          800: '#14254A',
          900: '#0B1B3A',
        },
        midnight: {
          800: '#181E26',
          850: '#11161D',
          900: '#0B0F14',
          950: '#070A0E',
        },
        telemetry: {
          blue: '#00D9FF', // Electric Cyan
          aqua: '#00D9FF', // Electric Cyan
          pink: '#FF4FA3',
          lime: '#10E57A', // Racing Lime
          amber: '#FFD43B', // Racing Yellow
          red: '#FF304F', // Racing Red
          orange: '#E07212', // ZFS Brand Orange
          purple: '#A855F7', // Cyber Violet
        },
        brand: {
          orange: 'var(--brand-orange, #E07212)',
          'orange-hover': 'var(--brand-orange-hover, #ED7D0D)',
          'orange-pressed': 'var(--brand-orange-pressed, #C6620A)',
          'orange-soft': 'var(--brand-orange-soft, rgba(224, 114, 18, 0.12))',
          'orange-glow': 'var(--brand-orange-glow, rgba(224, 114, 18, 0.35))',
          'light-orange': 'var(--brand-light-orange, #C2410C)',
          ink: 'var(--brand-ink, #070B0E)',
          white: 'var(--brand-white, #F2F4F7)',
        }
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        sans: ['"Exo 2"', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-brand': '0 0 16px rgba(224, 114, 18, 0.4)',
        'cyber-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'cyber': '0 4px 16px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'cyber-elevated': '0 12px 32px -4px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
      },
    },
  },
  plugins: [],
}
