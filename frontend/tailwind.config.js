module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#1e40af",
      },
      screens: {
        xs: "475px",
        // md: 768px, lg: 1024px (Tailwind defaults) — use for tablet/desktop layouts
      },
      maxWidth: {
        "8xl": "88rem",
      },
    },
  },
  plugins: [],
}
