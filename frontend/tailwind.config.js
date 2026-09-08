/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fefdfb',
          100: '#fdf9f4',
          200: '#faf4ec',
          300: '#f5ecdf',
        },
        oatmeal: {
          50: '#faf7f2',
          100: '#f7f3ee',
          200: '#f1ede8',
          300: '#ebe8e3',
          400: '#e4dfd8',
          500: '#cfc8be',
        },
        terracotta: {
          50: '#fdf5f2',
          100: '#fbe8e2',
          200: '#ffdbd1',
          300: '#ffb5a0',
          400: '#d97457',
          500: '#c05e41',
          600: '#b8583c',
          700: '#994126',
          800: '#7d2c13',
        },
        sage: {
          50: '#f4f7f5',
          100: '#e5ede9',
          200: '#cee5da',
          300: '#b5ccc1',
          400: '#8da399',
          500: '#6b8479',
          600: '#4e635a',
          700: '#3b4d45',
        },
        ink: {
          400: '#8e867f',
          500: '#746d65',
          600: '#56423d',
          700: '#45433f',
          800: '#31302d',
          900: '#1c1c19',
        },
      },
      boxShadow: {
        'paper': '0 2px 10px -2px rgba(45, 40, 37, 0.05), 0 1px 3px 0 rgba(45, 40, 37, 0.03)',
        'paper-elevated': '0 12px 28px -4px rgba(45, 40, 37, 0.07), 0 4px 10px -2px rgba(45, 40, 37, 0.04)',
        'paper-floating': '0 20px 40px -6px rgba(45, 40, 37, 0.10), 0 8px 16px -4px rgba(45, 40, 37, 0.05)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
