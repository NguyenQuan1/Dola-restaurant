/** @type {import('tailwindcss').Config} */
// Bảng màu & font đồng bộ với dola-restaurant (xem README.md — Bảng màu)
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // nền
        paper: '#FBF7EE',      // ivory — nền chính (giống dola)
        surface: '#FFFFFF',    // nền thẻ/card
        border: '#E6DECB',     // viền ấm, tông ivory-deep của dola
        muted: '#75847A',      // chữ phụ, tông ink.soft ngả xanh ngọc
        text: '#23302A',       // chữ chính — trùng ink của dola
        ink: {
          DEFAULT: '#23302A',
          soft: '#5B6B62',
        },
        // màu nhấn — ánh xạ 1:1 sang bảng màu dola
        saffron: {              // ánh xạ sang "gold" của dola
          DEFAULT: '#C9973F',
          dark: '#A6772C',
          light: '#F5EAD3',
        },
        teal: {                 // ánh xạ sang "jade" của dola
          DEFAULT: '#2F6B52',
          light: '#EAF3EE',
        },
        clay: {                 // ánh xạ sang "lacquer" của dola
          DEFAULT: '#A63D2F',
          light: '#F6E3DF',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Be Vietnam Pro"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(35,48,42,0.05), 0 4px 16px rgba(35,48,42,0.06)',
      },
      borderRadius: {
        xl: '14px',
      },
    },
  },
  plugins: [],
}
