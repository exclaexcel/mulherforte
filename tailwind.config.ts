import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        oliva: {
          DEFAULT: "#4A5D23",
          dark: "#3A4A1C",
          light: "#6B7F3A",
        },
        rosa: {
          DEFAULT: "#E8B4B8",
          soft: "#F5D6D8",
        },
        bege: {
          DEFAULT: "#F7F3EB",
          dark: "#EDE6D9",
        },
      },
    },
  },
  plugins: [],
};

export default config;
