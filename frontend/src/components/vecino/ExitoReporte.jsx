import { motion, useReducedMotion } from "framer-motion";
import { Check, CircleCheckBig, RotateCcw } from "lucide-react";
import { InsigniaUrgencia } from "./PanelReporte";
import { TIPO_RESIDUO } from "./textos";

const FOCO = "focus:outline-none focus-visible:ring-2 focus-visible:ring-muni-primary focus-visible:ring-offset-2";

function Dato({ etiqueta, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-base last:border-b-0">
      <span className="text-gray-600">{etiqueta}</span>
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
      className="flex min-h-0 flex-col gap-3.5 overflow-auto rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div role="status" className="flex items-start gap-3 rounded-xl border border-ok-borde bg-ok-fondo p-4 text-ok">
        <CircleCheckBig aria-hidden="true" className="h-6 w-6 shrink-0" />
        <div>
          <b id="t-exito" className="block text-lg">Recibimos tu reporte</b>
          <p className="text-base text-gray-800">
            Folio <span className="font-semibold tabular-nums">#{folio}</span> · {reporte.sector?.nombre}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h2 className="mb-1 text-base font-semibold">Lo que entendimos</h2>
        <Dato etiqueta="Tipo">{TIPO_RESIDUO[r.tipo_residuo] || r.tipo_residuo}</Dato>
        <Dato etiqueta="Urgencia"><InsigniaUrgencia prioridad={r.prioridad} /></Dato>
        {r.ubicacion && <Dato etiqueta="Ubicación">{r.ubicacion}</Dato>}
        <Dato etiqueta="Otros reportes aquí">
          {otros === 0 ? "Eres el primero" : `${otros} vecino${otros === 1 ? "" : "s"} más`}
        </Dato>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h2 className="mb-2 text-base font-semibold">Qué pasa ahora</h2>
        <ol className="flex flex-col gap-2.5 text-[15px]">
          <li className="flex items-start gap-2.5">
            <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ok-fondo text-ok">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            Reporte recibido y ordenado por urgencia
          </li>
          <li className="flex items-start gap-2.5">
            <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">2</span>
            Gestión de Calidad lo revisa y aprueba el retiro
          </li>
          <li className="flex items-start gap-2.5">
            <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">3</span>
            <span>Se envía el equipo de retiro <span className="text-gray-600">(despacho simulado)</span></span>
          </li>
        </ol>
      </div>

      <button
        type="button"
        onClick={alReiniciar}
        className={`mt-auto inline-flex w-full items-center justify-center gap-2 rounded-lg bg-muni-primary-a11y px-4 py-3 text-base font-semibold text-white hover:bg-muni-primary-700 ${FOCO}`}
      >
        <RotateCcw aria-hidden="true" className="h-5 w-5" />
        Hacer otro reporte
      </button>
    </motion.aside>
  );
}
