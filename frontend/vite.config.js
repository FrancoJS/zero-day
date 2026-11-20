import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El navegador solo habla con Vite; Vite reenvía /api al backend.
// Así funciona igual en localhost y en la IP pública del servidor.
const DESTINO_API = process.env.DESTINO_API || "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    watch: { usePolling: true }, // necesario con Docker en Windows/macOS
    proxy: {
      "/api": { target: DESTINO_API, changeOrigin: true },
    },
  },
});
