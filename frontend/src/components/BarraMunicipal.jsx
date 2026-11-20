import { useEffect, useState } from "react";
import { obtenerSalud } from "../api";

const VISTAS = [
  { id: "vecino", nombre: "Vecino", detalle: "Reportar un microbasural" },
  { id: "encargado", nombre: "Encargado", detalle: "Gestión de Calidad" },
];

/**
 * Estado discreto de la IA: en LIVE solo un punto + texto; MOCK y sin conexión se ven siempre (honestidad).
 */
function EstadoIA() {
  const [estado, setEstado] = useState(null); // null | "live" | "mock" | "error"
  useEffect(() => {
    let vivo = true;
    obtenerSalud()
      .then((s) => vivo && setEstado(s?.modo_ia === "live" ? "live" : "mock"))
      .catch(() => vivo && setEstado("error"));
    return () => {
      vivo = false;
    };
  }, []);

  if (estado === "live") {
    return (
      <span role="status" className="inline-flex items-center gap-2 text-sm text-white/90">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-white/80" />
        IA en línea
      </span>
    );
  }
  if (estado === "mock") {
    return (
      <span role="status" className="rounded-full border border-adv-borde bg-adv-fondo px-3 py-0.5 text-sm font-semibold text-adv">
        IA simulada (MOCK)
      </span>
    );
  }
  if (estado === "error") {
    return (
      <span role="status" className="rounded-full border border-critico-borde bg-white px-3 py-0.5 text-sm font-semibold text-critico">
        Sin conexión con el servidor
      </span>
    );
  }
  return null;
}

/**
 * Barra roja institucional (diseño 03/04): marca, pestañas Vecino/Encargado y estado discreto de la IA.
 * Las pestañas son enlaces ?vista=… (sin router).
 * @param {{ vista: "vecino" | "encargado" }} props
 */
export default function BarraMunicipal({ vista }) {
  return (
    <header className="bg-navbar text-white">
      <div className="container flex items-center justify-between gap-6 py-3">
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-white text-[15px] font-bold text-muni-primary-a11y">
            R
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-bold">Municipalidad de Rancagua</p>
            <p className="text-[13px] opacity-90">Gestión de Calidad · Microbasurales</p>
          </div>
        </div>

        <nav aria-label="Vistas del prototipo" className="flex items-center gap-1 rounded-full bg-white/15 p-1">
          {VISTAS.map((v) => {
            const activa = v.id === vista;
            return (
              <a
                key={v.id}
                href={`?vista=${v.id}`}
                aria-current={activa ? "page" : undefined}
                title={v.detalle}
                className={`rounded-full px-5 py-1.5 text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-muni-primary-a11y ${
                  activa ? "bg-white text-muni-primary-a11y shadow-sm" : "text-white hover:bg-white/20"
                }`}
              >
                {v.nombre}
              </a>
            );
          })}
        </nav>

        <div className="flex min-w-[220px] items-center justify-end">
          <EstadoIA />
        </div>
      </div>
    </header>
  );
}
