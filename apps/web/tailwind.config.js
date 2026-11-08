/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F3F6FB',
          100: '#E3EAF5',
          500: '#2F5A9E',
          600: '#23467E',
          700: '#1B3A6B',
          800: '#12284C',
          900: '#0D1F3C',
          950: '#091329',
        },
        cream: '#FBF3E6',
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
      },
    },
  },
  plugins: [],
};
