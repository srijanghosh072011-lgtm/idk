/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#0A0A0A',
        muted: '#525252',
        line: '#E5E5E5',
        paper: '#FAFAFA',
        accent: '#2563EB',
        accentSoft: '#EFF4FF',
      },
      letterSpacing: {
        tightest: '-0.05em',
      },
    },
  },
  plugins: [],
};
