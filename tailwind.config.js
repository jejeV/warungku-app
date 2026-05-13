/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#FFF5EB',
          100: '#FFE6C7',
          200: '#FFC985',
          300: '#FFAA42',
          400: '#FF8F0F',
          500: '#E97400',
          600: '#C05C00',
          700: '#994700',
          800: '#7A3800',
          900: '#5C2A00',
        },
      },
    },
  },
  plugins: [],
}
