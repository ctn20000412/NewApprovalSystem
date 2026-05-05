/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef9fc',
          100: '#d6f0f6',
          200: '#aee0ec',
          300: '#7bc8dd',
          400: '#43accb',
          500: '#1f8ea8',
          600: '#176f87',
          700: '#15596d',
          800: '#164a59',
          900: '#173d49',
        },
        accent: {
          50: '#fff8ec',
          100: '#fce9c8',
          200: '#f7d58d',
          300: '#f0bc57',
          400: '#e0a131',
          500: '#c98520',
          600: '#a96a1b',
          700: '#875317',
          800: '#6f4418',
          900: '#5c3917',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 14px 40px -28px rgba(15, 23, 42, 0.32), 0 6px 18px -14px rgba(23, 61, 73, 0.24)',
        'card-hover': '0 24px 48px -28px rgba(15, 23, 42, 0.34), 0 18px 28px -24px rgba(23, 61, 73, 0.22)',
        sidebar: '20px 0 42px rgba(15, 23, 42, 0.28)',
      },
      animation: {
        'fade-in': 'fadeIn 0.38s ease-out',
        'slide-up': 'slideUp 0.42s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
