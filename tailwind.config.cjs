/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/styles.css",
    "./src/**/*.{js,jsx,ts,tsx,css}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#7c93f6',
          500: '#5065f0',
          600: '#3e4fd1'
        },
        success: '#16a34a',
        danger:  '#ef4444',
        warn:    '#f59e0b'
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px'
      },
      boxShadow: {
        soft: '0 6px 18px rgba(16,24,40,0.06)',
        ui:   '0 8px 30px rgba(12,24,48,0.08)'
      },
      fontFamily: {
        ui: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial']
      }
    }
  },
  plugins: []
}
