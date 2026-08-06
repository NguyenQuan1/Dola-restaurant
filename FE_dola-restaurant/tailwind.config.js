/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#FBF7EE',
          deep: '#F3ECDC',
        },
        jade: {
          50: '#EAF3EE',
          100: '#CFE4D8',
          400: '#3D8062',
          500: '#2F6B52',
          600: '#255943',
          700: '#1E4A38',
          900: '#12291F',
        },
        gold: {
          light: '#E4C077',
          DEFAULT: '#C9973F',
          dark: '#A6772C',
        },
        lacquer: {
          DEFAULT: '#A63D2F',
          dark: '#812F24',
        },
        ink: {
          DEFAULT: '#23302A',
          soft: '#5B6B62',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        script: ['"Cormorant Garamond"', 'serif'],
        body: ['"Be Vietnam Pro"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 12px 30px -10px rgba(30, 74, 56, 0.25)',
        gold: '0 0 0 1px rgba(201,151,63,0.35), 0 12px 24px -8px rgba(166,61,47,0.18)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
