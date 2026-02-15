/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        brand: {
          pink: '#FF4D4D',
          yellow: '#F9CB28',
          neon: '#00FF94',
          cyan: '#00F0FF',
          dark: '#09090b',
        },
      },
      backgroundImage: {
        'sunset-gradient': 'linear-gradient(to right, #FF4D4D, #F9CB28)',
        'electric-gradient': 'linear-gradient(to right, #00FF94, #00F0FF)',
        'dark-glass': 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
      },
      borderRadius: {
        '3xl': '30px',
        '4xl': '40px',
      },
    },
  },
  plugins: [],
}

