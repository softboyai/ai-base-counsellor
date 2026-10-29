/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        sans: ["Onest", "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        paper: "#F3EEE4",
        surface: "#FBF8F2",
        sunken: "#EAE4D8",
        line: "#DDD5C6",
        ink: "#16211D",
        muted: "#667068",
        pine: {
          DEFAULT: "#1E5B47",
          hover: "#17493A",
          tint: "#DCE9E1",
        },
        butter: "#F0D79B",
        clay: {
          DEFAULT: "#B9512F",
          tint: "#F5E3DA",
        },
        dark: {
          bg: "#0D1311",
          surface: "#141B18",
          line: "#26312C",
          ink: "#ECE8DE",
          muted: "#9AA39B",
        },
      },
      borderRadius: {
        card: "14px",
        input: "10px",
      },
      spacing: {
        "4.5": "18px",
      },
      maxWidth: {
        content: "1120px",
      },
    },
  },
  plugins: [],
};
