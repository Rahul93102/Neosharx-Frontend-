/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}", "!./node_modules/**/*"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#067ff9",
        "background-light": "#f5f7f8",
        "background-dark": "#0f1923",
        "content-light": "#111418",
        "content-dark": "#f5f7f8",
        "subtle-light": "#5f758c",
        "subtle-dark": "#a0aec0",
      },
      fontFamily: {
        display: ["Newsreader"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};
