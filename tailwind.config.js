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
        herobid: {
          bg: '#0A0A14',
          dark: '#07070F',
          surface: '#0E1324',
          card: '#12182D',
          cardHover: '#18213D',
          border: 'rgba(255, 77, 109, 0.16)',
          borderHover: 'rgba(255, 77, 109, 0.45)',
          cyan: '#FF1744',
          neon: '#FF4D6D',
          blue: '#3B82F6',
          purple: '#A855F7',
          pink: '#EC4899',
          gold: '#F59E0B',
          red: '#EF4444',
          green: '#10B981',
          textMuted: '#64748B',
        },
        pitch: {
          dark: '#0A0A14',
          card: '#12182D',
          cardHover: '#18213D',
          border: 'rgba(255, 77, 109, 0.16)',
          subtle: '#1C2542',
          accent: '#FF1744',
          accentGlow: '#FF4D6D',
          neon: '#FF1744',
        }
      },
      fontFamily: {
        sans: ['Rajdhani', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Orbitron', 'Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(255, 23, 68, 0.25)',
        'glow-cyan-lg': '0 0 35px rgba(255, 77, 109, 0.45)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.3)',
        'glow-gold': '0 0 20px rgba(245, 158, 11, 0.3)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
      }
    },
  },
  plugins: [],
}

