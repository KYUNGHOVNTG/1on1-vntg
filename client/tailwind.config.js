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
          DEFAULT: '#4950DC',
          hover: '#3840C5',
        },
        secondary: {
          DEFAULT: '#2E81B1',
          hover: '#256991',
        },
        accent: {
          DEFAULT: '#14B287',
          hover: '#108E6C',
        },
        surface: '#F9FAFB',
        border: '#E5E7EB',
        text: {
          main: '#111827',
          sub: '#6B7280',
        },
        success: {
          DEFAULT: '#14B287', // Using accent for success consistency
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
