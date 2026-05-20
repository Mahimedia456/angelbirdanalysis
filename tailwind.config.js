/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        angelDark: "#2f3d46",
        angelDarker: "#24313a",
        angelLime: "#d7ff00",
        angelSoft: "#f4f6f6",
        angelMuted: "#e9eeee",
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 50px rgba(47, 61, 70, 0.08)",
      },
    },
  },
  plugins: [],
};