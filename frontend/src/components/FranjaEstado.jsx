import Icono from "./Iconos";

// Sub-paleta Borgoña / Vino (DESING.md §2.2) para el estado informativo/operativo
// y estados semánticos emerald / red (§2.4) para éxito y error.
const TONOS = {
  info: {
    franja: "bg-rose-50/60 border-rose-200/80 dark:bg-gray-900 dark:border-rose-900/50",
    mensaje: "text-[#8C1D28] dark:text-rose-200",
    icono: null,
  },
  ok: {
    franja: "bg-emerald-50/90 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/60",
    mensaje: "text-emerald-800 dark:text-emerald-200",
    icono: "check",
  },
  error: {
    franja: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/60",
    mensaje: "text-red-800 dark:text-red-200",
    icono: "cruz",
  },
};

const LECTOR = { hecho: "completado", actual: "en curso", pendiente: "pendiente", error: "con error" };

/**
 * Franja de estado bajo el Navbar: qué está pasando AHORA, en una línea, con pasos del flujo.
 * Usa la sub-paleta Borgoña/Vino (`#8C1D28` + `rose-*`) en reposo/proceso para evitar fatiga visual.
 */
export default function FranjaEstado({ tono = "info", mensaje, detalle, ocupado, pasos = [], className = "" }) {
  const estilo = TONOS[tono] || TONOS.info;
  return (
    <section
      role={tono === "error" ? "alert" : "status"}
      aria-live={tono === "error" ? "assertive" : "polite"}
      className={`flex flex-wrap items-center gap-x-6 gap-y-2 border-b py-3 ${estilo.franja} ${className}`}
    >
      <p className={`flex min-w-0 flex-1 basis-80 items-center gap-2 text-base sm:text-lg font-bold leading-snug ${estilo.mensaje}`}>
        {ocupado && (
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 animate-pulso rounded-full bg-muni-primary motion-reduce:animate-none"
          />
        )}
        {!ocupado && estilo.icono && <Icono nombre={estilo.icono} className="h-5 w-5" grosor={2.6} />}
        <span className="min-w-0">
          {mensaje}
          {detalle && <span className="font-normal text-gray-700 dark:text-gray-300"> {detalle}</span>}
        </span>
      </p>
      {pasos.length > 0 && (
        <ol aria-label="Progreso" className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          {pasos.map((paso, i) => (
            <li key={paso.nombre} className="flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden="true" className="text-gray-400">
                  →
                </span>
              )}
              <Paso paso={paso} numero={i + 1} ocupado={ocupado} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Paso({ paso, numero, ocupado }) {
  const { estado } = paso;
  const circulo = {
    hecho: "border-emerald-600 bg-emerald-600 text-white",
    actual: "border-muni-primary-a11y bg-muni-primary-a11y text-white shadow-xs",
    error: "border-red-700 bg-red-700 text-white",
    pendiente: "border-gray-300 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
  }[estado];
  return (
    <span
      aria-current={estado === "actual" ? "step" : undefined}
      className={`flex items-center gap-1.5 ${
        estado === "actual" ? "font-bold text-gray-900 dark:text-white" : ""
      } ${estado === "error" ? "font-bold text-red-800 dark:text-red-300" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`grid h-6 w-6 place-items-center rounded-full border text-xs font-bold tabular-nums ${circulo}`}
      >
        {estado === "hecho" && <Icono nombre="check" className="h-3.5 w-3.5" grosor={3} />}
        {estado === "error" && "!"}
        {estado === "actual" && ocupado && (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
        )}
        {((estado === "actual" && !ocupado) || estado === "pendiente") && numero}
      </span>
      {paso.nombre}
      <span className="sr-only">({LECTOR[estado]})</span>
    </span>
  );
}
