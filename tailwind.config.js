/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A5F',
          light: '#2D5A8E',
          dark: '#152C49',
        },
        accent: {
          DEFAULT: '#FF8C42',
          light: '#FFA366',
          dark: '#E67330',
        },
        surface: {
          DEFAULT: '#F0F4F8',
          card: '#FFFFFF',
          border: '#E8EDF2',
        },
        text: {
          primary: '#2D3E50',
          secondary: '#6B7B8D',
          muted: '#9BA8B7',
          faint: '#C4CDD5',
        },
        success: '#4CAF50',
        danger: '#E57373',
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
      },
    },
  },
  plugins: [],
};
