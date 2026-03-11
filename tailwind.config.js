/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        peelBg: '#050505',
        peelText: '#f4f1ed',
      },
    },
  },
  plugins: [],
};
