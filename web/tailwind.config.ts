import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ios: {
          bg: "#F2F2F7",
          card: "#FFFFFF",
          sep: "#E5E5EA",
          label: "#1C1C1E",
          secondary: "#8E8E93",
          tertiary: "#AEAEB2",
        },
        brand: {
          rose: "#FF375F",
          blue: "#007AFF",
          teal: "#00897B",
          lavender: "#AF52DE",
          orange: "#FF9500",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
