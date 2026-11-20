/** @type {import('tailwindcss').Config} */
// Paleta "Operación clara" (design/zero-day-estados/04-operacion-clara.html).
// `theme.colors` REEMPLAZA la paleta de Tailwind: solo existen estos tokens.
// Una clase fuera de la paleta (bg-red-500, text-slate-400, bg-indigo-600…) no genera estilos:
// si algo se ve sin color, se usó un color que no es de la paleta → usar un token de aquí.
// Para agregar un color nuevo: decidirlo con el equipo y agregarlo aquí (nunca colores sueltos en los componentes).
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",
      white: "#FFFFFF", // solo texto sobre acento/estados sólidos
      fondo: "#FAF9F7", // fondo cálido de la página (no encandila en proyector)
      superficie: "#FFFFFF", // tarjetas y paneles
      sutil: "#F3F2EF", // fichas, barras vacías, ruido
      borde: { DEFAULT: "#E4E2DD", fuerte: "#B9B7B1" },
      texto: "#161618", // principal
      texto2: "#4A4A4F", // secundario
      texto3: "#6B6B70", // detalle (mínimo 14px)
      acento: {
        DEFAULT: "#2952E3", // único acento: marca y acción principal
        osc: "#1E3FB8",
        suave: "#E8EDFD",
        borde: "#C7D3FA",
        tenue: "#F7F9FF",
      },
      ok: { DEFAULT: "#15803D", fondo: "#DCFCE7", borde: "#86EFAC" },
      adv: { DEFAULT: "#92400E", fondo: "#FEF3C7", borde: "#FCD34D" }, // más oscuro que el diseño, para proyector
      parcial: { DEFAULT: "#C2410C", fondo: "#FFEDD5", borde: "#FDBA74" },
      critico: { DEFAULT: "#B91C1C", fondo: "#FEE2E2", borde: "#FCA5A5" },
    },
    extend: {
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
