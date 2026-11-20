import IndicadorModo from "./IndicadorModo";

const VISTAS = [
  { id: "vecino", nombre: "Vecino", detalle: "Reportar un microbasural" },
  { id: "encargado", nombre: "Encargado", detalle: "Gestión de Calidad" },
];

/**
 * Barra roja institucional (diseño 03/04): marca, pestañas Vecino/Encargado, "Prototipo, no oficial"
 * y el indicador Kostra LIVE/MOCK. Las pestañas son enlaces ?vista=… (sin router).
 * @param {{ vista: "vecino" | "encargado" }} props
 */
export default function BarraMunicipal({ vista }) {
  return (
    <header className="bg-navbar text-white">
      <div className="flex items-center justify-between gap-6 px-8 py-3">
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

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/35 bg-white/15 px-3 py-0.5 text-xs font-semibold">Prototipo, no oficial</span>
          <div className="rounded-full bg-white">
            <IndicadorModo />
          </div>
        </div>
      </div>
    </header>
  );
}
