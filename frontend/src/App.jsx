import { Suspense, lazy } from "react";
import BarraMunicipal from "./components/BarraMunicipal";

// Dos pantallas (diseños 04 y 03 de design/microbasurales/): ?vista=vecino (por defecto) y ?vista=encargado.
// ?laboratorio abre la pantalla de prueba de la base (análisis suelto + streaming + panel de calidad).
const VistaVecino = lazy(() => import("./vistas/VistaVecino"));
const VistaEncargado = lazy(() => import("./vistas/VistaEncargado"));
const Laboratorio = lazy(() => import("./vistas/Laboratorio"));

const parametros = new URLSearchParams(window.location.search);
const vista = parametros.get("vista") === "encargado" ? "encargado" : "vecino";

export default function App() {
  if (parametros.has("laboratorio")) {
    return (
      <Suspense fallback={null}>
        <Laboratorio />
      </Suspense>
    );
  }
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gray-50 text-gray-900">
      <BarraMunicipal vista={vista} />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Suspense fallback={<p className="p-8 text-gray-600">Cargando…</p>}>
          {vista === "encargado" ? <VistaEncargado /> : <VistaVecino />}
        </Suspense>
      </main>
    </div>
  );
}
