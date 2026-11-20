import Icono from "./Iconos";

const TONOS = {
  info: { franja: "bg-acento-suave border-acento", mensaje: "text-acento-osc", icono: null },
  ok: { franja: "bg-ok-fondo border-ok", mensaje: "text-ok", icono: "check" },
  error: { franja: "bg-critico-fondo border-critico", mensaje: "text-critico", icono: "cruz" },
};

const LECTOR = { hecho: "completado", actual: "en curso", pendiente: "pendiente", error: "con error" };

/**
 * Franja de estado bajo el encabezado: qué está pasando AHORA, en una línea, con pasos del flujo.
 * Cambia de color según el tono, pero siempre dice el estado con texto e ícono.
 * @param {object} props
 * @param {"info"|"ok"|"error"} [props.tono="info"]  info = trabajando/listo, ok = terminado, error = falló
 * @param {React.ReactNode} props.mensaje  mensaje principal en negrita (ej. "Analizando…")
 * @param {React.ReactNode} [props.detalle]  detalle en peso normal (ej. "· 8 señales en 4,2 s")
 * @param {boolean} [props.ocupado]  muestra un punto que late junto al mensaje (trabajando)
 * @param {{nombre: string, estado: "hecho"|"actual"|"pendiente"|"error"}[]} [props.pasos]
 * @param {string} [props.className]  ej. padding horizontal para alinear con la página
 */
export default function FranjaEstado({ tono = "info", mensaje, detalle, ocupado, pasos = [], className = "" }) {
  const estilo = TONOS[tono] || TONOS.info;
  return (
    <section
      role={tono === "error" ? "alert" : "status"}
      aria-live={tono === "error" ? "assertive" : "polite"}
      className={`flex flex-wrap items-center gap-x-6 gap-y-2 border-b-2 py-3.5 ${estilo.franja} ${className}`}
    >
      <p className={`flex min-w-0 flex-1 basis-80 items-center gap-2 text-[21px] font-bold leading-snug ${estilo.mensaje}`}>
        {ocupado && (
          <span aria-hidden="true" className="h-3 w-3 shrink-0 animate-pulso rounded-full bg-current motion-reduce:animate-none" />
        )}
        {!ocupado && estilo.icono && <Icono nombre={estilo.icono} className="h-6 w-6" grosor={3} />}
        <span className="min-w-0">
          {mensaje}
          {detalle && <span className="font-medium text-texto"> {detalle}</span>}
        </span>
      </p>
      {pasos.length > 0 && (
        <ol aria-label="Progreso" className="flex flex-wrap items-center gap-2.5 text-[17px] text-texto2">
          {pasos.map((paso, i) => (
            <li key={paso.nombre} className="flex items-center gap-2.5">
              {i > 0 && (
                <span aria-hidden="true" className="text-texto3">
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
    hecho: "border-ok bg-ok text-white",
    actual: "border-acento bg-acento text-white",
    error: "border-critico bg-critico text-white",
    pendiente: "border-texto3 bg-superficie text-texto3",
  }[estado];
  return (
    <span
      aria-current={estado === "actual" ? "step" : undefined}
      className={`flex items-center gap-2 ${estado === "actual" ? "font-bold text-texto" : ""} ${
        estado === "error" ? "font-bold text-critico" : ""
      }`}
    >
      <span aria-hidden="true" className={`grid h-7 w-7 place-items-center rounded-full border-2 text-[15px] font-bold ${circulo}`}>
        {estado === "hecho" && <Icono nombre="check" className="h-4 w-4" grosor={3.4} />}
        {estado === "error" && "!"}
        {estado === "actual" && ocupado && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
        )}
        {((estado === "actual" && !ocupado) || estado === "pendiente") && numero}
      </span>
      {paso.nombre}
      <span className="sr-only">({LECTOR[estado]})</span>
    </span>
  );
}
