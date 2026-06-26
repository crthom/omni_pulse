/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pulse: {
          bg: '#0a0e17',
          panel: '#111827',
          border: '#1e293b',
          green: '#22c55e',
          amber: '#f59e0b',
          red: '#ef4444',
          neon: '#00f0ff',
          accent: '#6366f1',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-red': 'pulse-red 1.5s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 8px #ef4444, 0 0 16px #ef4444' },
          '50%': { boxShadow: '0 0 20px #ef4444, 0 0 40px #ef4444' },
        },
        glow: {
          from: { filter: 'drop-shadow(0 0 4px #00f0ff)' },
          to: { filter: 'drop-shadow(0 0 12px #00f0ff)' },
        },
      },
    },
  },
  plugins: [],
}
