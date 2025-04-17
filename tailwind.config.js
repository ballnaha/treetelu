/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f1f8ed',
          100: '#e2f1dc',
          200: '#c4e3b8',
          300: '#a7d595',
          400: '#89c671',
          500: '#77AF55', // TreeTelu main green
          600: '#5a9b35',
          700: '#4a7f2d',
          800: '#3b6623',
          900: '#2D743C', // TreeTelu dark green
        },
        accent: {
          100: '#F4F3EB', // TreeTelu light accent color
          200: '#E5E3D1',
          300: '#D6D3B8',
          400: '#C7C39F',
          500: '#B7B386',
        },
      },
      fontFamily: {
        sans: ['Prompt', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}; 