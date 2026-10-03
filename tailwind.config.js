/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          dark: '#080d11',
          card: '#0f171e',
          cardHover: '#16222c',
          border: '#1e2c38',
          subtle: '#233342',
          accent: '#10b981',
          accentGlow: '#059669',
          neon: '#00e676',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
