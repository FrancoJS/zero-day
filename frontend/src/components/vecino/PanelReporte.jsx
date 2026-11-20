import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Check, CircleCheckBig, CircleHelp, Clock, Info, Send, TriangleAlert } from "lucide-react";
import { TIPO_RESIDUO, mayuscula } from "./textos";

const FOCO = "focus:outline-none focus-visible:ring-2 focus-visible:ring-muni-primary focus-visible:ring-offset-2";

const URGENCIA = {
  alta: { texto: "Alta", Icono: TriangleAlert, clase: "border-critico-borde bg-critico-fondo text-critico" },
  media: { texto: "Media", Icono: Clock, clase: "border-adv-borde bg-adv-fondo text-adv" },
  baja: { texto: "Baja", Icono: ArrowDown, clase: "border-gray-300 bg-gray-100 text-gray-700" },
};

export function InsigniaUrgencia({ prioridad }) {
  const u = URGENCIA[prioridad] || URGENCIA.baja;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-bold ${u.clase}`}>
      <u.Icono aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.4} />
      {u.texto}
    </span>
  );
}

/** Arma las filas del panel a partir del sector elegido y del último análisis. */
export function filasDelReporte(sector, resultado) {
  const filas = [];
  filas.push(
    sector
      ? { id: "sector", etiqueta: "Sector", valor: sector.nombre }
      : { id: "sector", etiqueta: "Sector", falta: "Falta: elige el sector en el chat" },
  );
  if (!resultado) return filas;
  filas.push({ id: "tipo", etiqueta: "Tipo de residuo", valor: TIPO_RESIDUO[resultado.tipo_residuo] || resultado.tipo_residuo });
  if (resultado.tipo_residuo !== "no_es_residuo") {
    filas.push({ id: "urgencia", etiqueta: "Urgencia", prioridad: resultado.prioridad, evidencia: resultado.evidencia?.[0] });
    filas.push(
      resultado.ubicacion
        ? { id: "ubicacion", etiqueta: "Ubicación", valor: mayuscula(resultado.ubicacion) }
        : { id: "ubicacion", etiqueta: "Ubicación", falta: "Falta: cuéntala en el chat" },
    );
    (resultado.falta_informacion || []).forEach((f, i) =>
      filas.push({ id: `falta-${i}`, etiqueta: mayuscula(f), falta: "Falta: responde en el chat" }),
    );
  }
  return filas;
}

function Fila({ fila }) {
  const pendiente = Boolean(fila.falta);
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 ${
        pendiente ? "border-dashed border-adv-borde bg-destacado" : "border-gray-200 bg-white"
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
          pendiente ? "bg-adv-fondo text-adv motion-safe:animate-pulso" : "bg-ok-fondo text-ok"
        }`}
      >
        {pendiente ? <CircleHelp className="h-4 w-4" strokeWidth={2.4} /> : <Check className="h-4 w-4" strokeWidth={3} />}
      </span>
      <div className="min-w-0">
        <div className="text-sm text-gray-600">{fila.etiqueta}</div>
        {pendiente && <div className="text-base font-semibold text-adv">{fila.falta}</div>}
        {fila.valor && <div className="text-base font-semibold text-gray-900">{fila.valor}</div>}
        {fila.prioridad && (
          <>
            <div className="mt-0.5"><InsigniaUrgencia prioridad={fila.prioridad} /></div>
            {fila.evidencia && (
              <div className="mt-1 text-sm text-gray-700">
                Porque dijiste:{" "}
                <mark className="border-b-2 border-adv bg-destacado px-0.5 text-gray-900">{fila.evidencia}</mark>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Marcador() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3">
      <span aria-hidden="true" className="h-7 w-7 shrink-0 rounded-full bg-gray-200" />
      <div className="flex-1">
        <div className="h-3 w-24 rounded bg-gray-200" />
        <div className="mt-1.5 text-sm text-gray-500">Esperando tu mensaje…</div>
      </div>
    </div>
  );
}

/**
 * Panel "Tu reporte" (se llena en vivo).
 * @param {{filas: any[], esperados: number, visibles: number, listos: number, total: number, completo: boolean,
 *   puedeEnviar: boolean, faltan: number, noEsResiduo: boolean, enviando: boolean, alEnviar: () => void}} props
 */
export default function PanelReporte({ filas, esperados, visibles, listos, total, completo, puedeEnviar, faltan, noEsResiduo, enviando, alEnviar }) {
  const reducir = useReducedMotion();
  const huecos = Math.max(0, esperados - Math.min(visibles, filas.length));

  let etiquetaBoton = "Enviar a Gestión de Calidad";
  if (enviando) etiquetaBoton = "Enviando…";
  else if (noEsResiduo) etiquetaBoton = "Este canal es solo para residuos";
  else if (!puedeEnviar) { const n = Math.max(1, faltan); etiquetaBoton += ` · falta ${n} dato${n === 1 ? "" : "s"}`; }

  return (
    <aside aria-labelledby="t-panel" className="flex min-h-0 flex-col gap-3.5 overflow-auto rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 id="t-panel" className="text-xl font-semibold">Tu reporte</h2>
        {completo ? (
          <span role="status" className="inline-flex items-center gap-2 rounded-full border border-ok-borde bg-ok-fondo px-3 py-1 text-sm font-bold text-ok">
            <CircleCheckBig aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.4} />
            Listo para enviar
          </span>
        ) : (
          <span role="status" className="inline-flex items-center gap-2 rounded-full border border-adv-borde bg-adv-fondo px-3 py-1 text-sm font-bold text-adv tabular-nums">
            <Clock aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.4} />
            Completando · {listos} de {total}
          </span>
        )}
      </div>
      <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-gray-100">
        <motion.span
          className={`block h-full rounded-full ${completo ? "bg-ok" : "bg-muni-primary-a11y"}`}
          initial={false}
          animate={{ width: `${(listos / total) * 100}%` }}
          transition={reducir ? { duration: 0 } : { duration: 0.4 }}
        />
      </div>
      <p className="-mt-1.5 text-sm text-gray-600">Se completa mientras conversas</p>

      <ul className="mt-1 flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {filas.slice(0, visibles).map((f) => (
            <motion.li
              key={f.id}
              layout={!reducir}
              initial={reducir ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reducir ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Fila fila={f} />
            </motion.li>
          ))}
        </AnimatePresence>
        {Array.from({ length: huecos }, (_, i) => (
          <li key={`hueco-${i}`}><Marcador /></li>
        ))}
      </ul>

      <button
        type="button"
        disabled={!puedeEnviar || enviando}
        onClick={alEnviar}
        className={
          puedeEnviar && !enviando
            ? `inline-flex w-full items-center justify-center gap-2 rounded-lg bg-muni-primary-a11y px-4 py-3 text-base font-semibold text-white hover:bg-muni-primary-700 ${FOCO}`
            : "inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-base font-semibold text-gray-500"
        }
      >
        <Send aria-hidden="true" className="h-[18px] w-[18px]" />
        {etiquetaBoton}
      </button>
      <p className="mt-auto flex items-start gap-2 text-sm text-gray-600">
        <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        Una persona del municipio lo revisa antes de enviar el retiro (despacho simulado).
      </p>
    </aside>
  );
}
