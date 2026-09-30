/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
          orange: '#FF6A00', // Racing Orange
        }
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        sans: ['"Exo 2"', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      boxShadow: {
        'cyber-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'cyber': '0 4px 16px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'cyber-elevated': '0 12px 32px -4px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
        'glow-cyan': '0 0 14px rgba(0, 217, 255, 0.35)',
        'glow-red': '0 0 14px rgba(255, 48, 79, 0.35)',
        'glow-orange': '0 0 14px rgba(255, 106, 0, 0.35)',
        'glow-yellow': '0 0 14px rgba(255, 212, 59, 0.35)',
        'glow-lime': '0 0 14px rgba(16, 229, 122, 0.35)',
        'glass-sm': '0 2px 8px -2px rgba(11, 27, 58, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.7)',
        'glass': '0 8px 30px -4px rgba(11, 27, 58, 0.12), inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'neon-blue': '0 0 15px rgba(0, 217, 255, 0.4)',
        'neon-aqua': '0 0 15px rgba(0, 217, 255, 0.4)',
        'neon-lime': '0 0 12px rgba(16, 229, 122, 0.4)',
      },
      backgroundImage: {
        'chrome-metallic': 'linear-gradient(180deg, #FFFFFF 0%, #E8F0FE 45%, #D0DFFA 55%, #EDF3FC 100%)',
        'holo-gradient': 'linear-gradient(135deg, #FF304F 0%, #00D9FF 50%, #FFD43B 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'cyber-gradient': 'linear-gradient(180deg, var(--surface-base) 0%, var(--surface-elevated) 100%)',
      }
    },
  },
  plugins: [],
}
