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
        chrome: {
          50: '#F8FBFF',
          100: '#EAF4FF',
          200: '#D5E6FC',
          300: '#C9D6E8',
          800: '#14254A',
          900: '#0B1B3A',
        },
        midnight: {
          800: '#121D38',
          850: '#0C1428',
          900: '#060B1A',
          950: '#030610',
        },
        telemetry: {
          blue: '#2F6BFF',
          aqua: '#22E4F0',
          pink: '#FF4FA3',
          lime: '#B6FF3B',
          amber: '#FFC53D',
          red: '#FF4D4D',
        }
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        sans: ['"Exo 2"', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      boxShadow: {
        'glass-sm': '0 2px 8px -2px rgba(11, 27, 58, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.7)',
        'glass': '0 8px 30px -4px rgba(11, 27, 58, 0.12), inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
        'neon-blue': '0 0 15px rgba(47, 107, 255, 0.5)',
        'neon-aqua': '0 0 15px rgba(34, 228, 240, 0.5)',
        'neon-lime': '0 0 12px rgba(182, 255, 59, 0.5)',
      },
      backgroundImage: {
        'chrome-metallic': 'linear-gradient(180deg, #FFFFFF 0%, #E8F0FE 45%, #D0DFFA 55%, #EDF3FC 100%)',
        'holo-gradient': 'linear-gradient(135deg, #FF4FA3 0%, #22E4F0 50%, #B892FF 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(240, 246, 255, 0.55) 100%)',
      }
    },
  },
  plugins: [],
}
