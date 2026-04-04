// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: "hsl(220 20% 90%)",
        input: "hsl(220 20% 90%)",
        ring: "hsl(25 95% 53%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(220 90% 15%)",
        primary: {
          DEFAULT: "hsl(220 90% 15%)",
          foreground: "hsl(0 0% 100%)",
        },
        secondary: {
          DEFAULT: "hsl(220 20% 95%)",
          foreground: "hsl(220 90% 15%)",
        },
        destructive: {
          DEFAULT: "hsl(0 84.2% 60.2%)",
          foreground: "hsl(0 0% 100%)",
        },
        muted: {
          DEFAULT: "hsl(220 20% 95%)",
          foreground: "hsl(220 30% 45%)",
        },
        accent: {
          DEFAULT: "hsl(25 95% 53%)",
          foreground: "hsl(0 0% 100%)",
        },
        popover: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(220 90% 15%)",
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(220 90% 15%)",
        },
      },
      
    },
  },
  plugins: [],
}