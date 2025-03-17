/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7f6',
          100: '#c5dbd8',
          200: '#a6c7c2',
          300: '#87b3ac',
          400: '#689f96',
          500: '#4a8b80',
          600: '#3b7066',
          700: '#2d554d',
          800: '#1e3a33',
          900: '#0f1f1a',
        },
        secondary: {
          50: '#f5e9c3',
          100: '#e5d9b3',
          200: '#d5c9a3',
          300: '#c5b993',
          400: '#b5a983',
          500: '#a59973',
          600: '#958963',
          700: '#857953',
          800: '#756943',
          900: '#655933',
        },
        dog: {
          gray: '#6b6b6b',
          lightgray: '#4a4a4a',
          mint: '#c5dbd8',
          cream: '#f5e9c3',
        }
      },
    },
  },
  plugins: [],
}; 