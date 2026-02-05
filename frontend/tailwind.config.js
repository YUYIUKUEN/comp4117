/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        fyplight: {
          primary: '#2563eb',
          secondary: '#0f172a',
          accent: '#22c55e',
          neutral: '#1e293b',
          'base-100': '#f8fafc',
          info: '#38bdf8',
          success: '#22c55e',
          warning: '#f97316',
          error: '#ef4444',
        },
      },
    ],
    darkTheme: 'fyplight',
  },
}

