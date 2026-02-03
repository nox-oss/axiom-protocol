import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        solprism: {
          50: "#f0f7ff",
          100: "#e0eefe",
          200: "#baddfd",
          300: "#7ec3fc",
          400: "#3aa5f8",
          500: "#108ae9",
          600: "#046dc7",
          700: "#0557a1",
          800: "#094a85",
          900: "#0d3f6e",
          950: "#092849",
        },
      },
    },
  },
  plugins: [],
};

export default config;
