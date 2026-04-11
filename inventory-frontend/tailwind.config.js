/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#effcf6',
          100: '#d7f6e7',
          200: '#b0ebca',
          300: '#7adca4',
          400: '#40c97a',
          500: '#1fa862',
          600: '#158452',
          700: '#116944',
          800: '#0f5439',
          900: '#0e4631',
        },
        accent: {
          50: '#fff8ed',
          100: '#feebcb',
          200: '#fbd58a',
          300: '#f0ba5c',
          400: '#dc9a35',
          500: '#c07e22',
          600: '#a4661c',
          700: '#845018',
          800: '#6b4317',
          900: '#593816',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 12px 30px -22px rgba(15, 23, 42, 0.22), 0 18px 40px -32px rgba(21, 132, 82, 0.28)',
        'card-hover': '0 26px 48px -28px rgba(15, 23, 42, 0.28), 0 18px 32px -24px rgba(21, 132, 82, 0.2)',
        sidebar: '16px 0 40px rgba(15, 23, 42, 0.18)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
