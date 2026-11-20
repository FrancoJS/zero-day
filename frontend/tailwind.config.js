/** @type {import('tailwindcss').Config} */
// Sistema de Diseño Municipal de Rancagua (DESING.md).
// Mantiene los tokens del kit (acento, texto, ok, adv…) Y expone toda la paleta de Tailwind
// (rose, emerald, green, amber, red, blue, slate, gray…) + tokens institucionales (muni-primary-*, vino, destacado).
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // --- Tokens del kit (mapeados al sistema municipal de DESING.md) ---
        fondo: "#F9FAFB", // gray-50
        superficie: "#FFFFFF", // white
        sutil: "#F3F4F6", // gray-100
        borde: { DEFAULT: "#E5E7EB", fuerte: "#D1D5DB" }, // gray-200 / gray-300
        texto: "#111827", // gray-900
        texto2: "#4B5563", // gray-600
        texto3: "#6B7280", // gray-500
        acento: {
          DEFAULT: "#C30101", // muni-primary
          osc: "#AE0101", // muni-primary-a11y (WCAG AA >= 4.5:1 con blanco)
          800: "#9A0101", // muni-primary-a11y-800
          hover: "#D90000", // muni-primary-700
          suave: "#FFDCDC", // muni-primary-100
          borde: "#FFBFBF", // muni-primary-200
          tenue: "#FFF0F0", // muni-primary-50
        },
        // --- Paleta oficial @theme (DESING.md §2.1) ---
        "muni-primary": {
          DEFAULT: "#C30101",
          a11y: { DEFAULT: "#AE0101", 800: "#9A0101" },
          50: "#FFF0F0",
          100: "#FFDCDC",
          200: "#FFBFBF",
          300: "#FF9393",
          400: "#FF5555",
          500: "#FF2121",
          600: "#FF0000",
          700: "#D90000",
          900: "#930909",
          950: "#510000",
        },
        // --- Sub-paleta Borgoña / Vino (DESING.md §2.2) ---
        vino: {
          DEFAULT: "#8C1D28",
          hover: "#A5222F",
          osc: "#6B151E",
        },
        destacado: "#FFF1D2",
        // --- Estados semánticos del kit (DESING.md §2.4) ---
        ok: { DEFAULT: "#047857", fondo: "#D1FAE5", borde: "#6EE7B7" }, // emerald
        adv: { DEFAULT: "#92400E", fondo: "#FEF3C7", borde: "#FCD34D" }, // amber
        parcial: { DEFAULT: "#C2410C", fondo: "#FFEDD5", borde: "#FDBA74" }, // orange
        critico: { DEFAULT: "#991B1B", fondo: "#FEE2E2", borde: "#FCA5A5" }, // red
      },
      fontFamily: {
        sans: ['"Open Sans"', "system-ui", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
      },
      screens: { xs: "475px", "3xl": "120rem" },
      spacing: { 4.5: "1.125rem", 19: "4.75rem", 113: "28.25rem" },
      fontSize: { "2xs": "0.7rem" },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      keyframes: {
        pulso: { "50%": { opacity: "0.4" } },
      },
      animation: {
        pulso: "pulso 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
