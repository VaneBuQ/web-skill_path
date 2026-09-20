/** Tokens tomados del prototipo de Figma. @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Morado de la marca: botones primarios, acentos, enlaces.
        brand: {
          DEFAULT: "#6C4CE6",
          deep: "#5A3AD1",
          soft: "#EDE7FE",
          softer: "#F5F1FF",
        },
        // Verde menta: éxito, racha, XP.
        mint: {
          DEFAULT: "#D9F5E6",
          ink: "#0F9D63",
        },
        // Tinta y superficies.
        ink: "#1B1930",
        body: "#6B7085",
        line: "#E8E8F0",
        canvas: "#F5F5F9",
        // Superficie oscura de las tarjetas de estudio.
        surface: {
          dark: "#1E1B33",
          darker: "#171530",
        },
        coral: {
          DEFAULT: "#E05A6B",
          soft: "#FDECEE",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
        panel: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,18,48,.05), 0 8px 24px -16px rgba(20,18,48,.22)",
        lifted: "0 20px 48px -20px rgba(20,18,48,.4)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        flip: {
          from: { opacity: "0", transform: "rotateX(-12deg)" },
          to: { opacity: "1", transform: "rotateX(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up .28s ease-out",
        flip: "flip .3s ease-out",
      },
    },
  },
  plugins: [],
};
