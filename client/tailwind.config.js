/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans KR"', 'sans-serif'],
      },
      letterSpacing: {
        tight: '-0.025em',
      },
      colors: {
        primary: {
          DEFAULT: '#5B5FED',
          hover: '#4f53d1',
        },
        surface: '#F9FAFB',
        border: '#E5E7EB',
        text: {
          main: '#111827',
          sub: '#6B7280',
        },
        success: {
          DEFAULT: '#059669', // emerald-600
        },
        warning: {
          DEFAULT: '#ea580c', // orange-600
        },
        error: {
          DEFAULT: '#dc2626', // red-600
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'soft': '0 4px 20px -12px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
