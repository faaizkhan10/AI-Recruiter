/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        wave: {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.5)" },
        },
      },
      animation: {
        wave: "wave 1s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};
