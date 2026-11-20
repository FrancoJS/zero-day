import { motion, useReducedMotion } from "framer-motion";
import { Check, CircleCheckBig, RotateCcw } from "lucide-react";
import { InsigniaUrgencia } from "./PanelReporte";
import { TIPO_RESIDUO } from "./textos";

const FOCO = "focus:outline-none focus-visible:ring-2 focus-visible:ring-muni-primary focus-visible:ring-offset-2";

function Dato({ etiqueta, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-1.5 text-xs sm:text-sm last:border-b-0">
      <span className="text-gray-500">{etiqueta}</span>
      <span className="text-right font-semibold text-gray-900">{children}</span>
    </div>
  );
}

/** Estado final tras POST /api/reportes (artboard 01, columna derecha). */
export default function ExitoReporte({ reporte, alReiniciar }) {
  const reducir = useReducedMotion();
  const r = reporte.analisis?.resultado || {};
  const otros = Math.max(0, (reporte.reportes_en_sector || 1) - 1);
  const folio = String(reporte.id).padStart(4, "0");

  return (
    <motion.aside
      aria-labelledby="t-exito"
      initial={reducir ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-0 flex-col gap-3 overflow-auto rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs"
    >
      <div role="status" className="flex items-start gap-3 rounded-xl border border-ok-borde bg-ok-fondo p-3.5 text-ok">
        <CircleCheckBig aria-hidden="true" className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <b id="t-exito" className="block text-sm sm:text-base font-bold">Recibimos tu reporte</b>
          <p className="text-xs sm:text-sm text-gray-800">
            Folio <span className="font-semibold tabular-nums">#{folio}</span> · {reporte.sector?.nombre}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200/80 p-3.5">
        <h2 className="mb-1 text-xs sm:text-sm font-semibold text-gray-900">Lo que entendimos</h2>
        <Dato etiqueta="Tipo">{TIPO_RESIDUO[r.tipo_residuo] || r.tipo_residuo}</Dato>
        <Dato etiqueta="Urgencia"><InsigniaUrgencia prioridad={r.prioridad} /></Dato>
        {r.ubicacion && <Dato etiqueta="Ubicación">{r.ubicacion}</Dato>}
        <Dato etiqueta="Otros reportes aquí">
          {otros === 0 ? "Eres el primero" : `${otros} vecino${otros === 1 ? "" : "s"} más`}
        </Dato>
      </div>

      <div className="rounded-xl border border-gray-200/80 p-3.5">
        <h2 className="mb-2 text-xs sm:text-sm font-semibold text-gray-900">Qué pasa ahora</h2>
        <ol className="flex flex-col gap-2 text-xs sm:text-sm text-gray-700">
          <li className="flex items-start gap-2.5">
            <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ok-fondo text-ok">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            Reporte recibido y ordenado por urgencia
          </li>
          <li className="flex items-start gap-2.5">
            <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">2</span>
            Gestión de Calidad lo revisa y aprueba el retiro
          </li>
          <li className="flex items-start gap-2.5">
            <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">3</span>
            <span>Se envía el equipo de retiro <span className="text-gray-500">(despacho simulado)</span></span>
          </li>
        </ol>
      </div>

      <button
        type="button"
        onClick={alReiniciar}
        className={`mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-muni-primary-a11y px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors hover:bg-muni-primary-700 ${FOCO}`}
      >
        <RotateCcw aria-hidden="true" className="h-4 w-4" />
        Hacer otro reporte
      </button>
    </motion.aside>
  );
}
