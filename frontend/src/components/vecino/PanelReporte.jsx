import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  Check,
  CircleAlert,
  CircleCheckBig,
  Clock,
  Compass,
  FileText,
  Info,
  MapPin,
  Send,
  Tag,
  TriangleAlert,
} from "lucide-react";
import { TIPO_RESIDUO, mayuscula } from "./textos";

const FOCO = "focus:outline-none focus-visible:ring-2 focus-visible:ring-muni-primary focus-visible:ring-offset-2";

const URGENCIA = {
  alta: { texto: "Alta", Icono: TriangleAlert, clase: "border-critico-borde bg-critico-fondo text-critico" },
  media: { texto: "Media", Icono: Clock, clase: "border-adv-borde bg-adv-fondo text-adv" },
  baja: { texto: "Baja", Icono: ArrowDown, clase: "border-gray-200 bg-gray-100 text-gray-700" },
};

export function InsigniaUrgencia({ prioridad }) {
  const u = URGENCIA[prioridad] || URGENCIA.baja;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${u.clase}`}>
      <u.Icono aria-hidden="true" className="h-3 w-3" strokeWidth={2.4} />
      {u.texto}
    </span>
  );
}

/** Icono contextual por cada tipo de campo */
function iconoDeFila(id) {
  if (id === "sector") return MapPin;
  if (id === "tipo") return Tag;
  if (id === "urgencia") return CircleAlert;
  if (id === "ubicacion") return Compass;
  return FileText;
}

/** Arma las filas del panel a partir del sector elegido y del último análisis. */
export function filasDelReporte(sector, resultado) {
  const filas = [];
  filas.push(
    sector
      ? { id: "sector", etiqueta: "Sector", valor: sector.nombre }
      : { id: "sector", etiqueta: "Sector", falta: "Falta seleccionar sector en el chat" },
  );
  if (!resultado) return filas;
  filas.push({ id: "tipo", etiqueta: "Tipo de residuo", valor: TIPO_RESIDUO[resultado.tipo_residuo] || resultado.tipo_residuo });
  if (resultado.tipo_residuo !== "no_es_residuo") {
    filas.push({ id: "urgencia", etiqueta: "Urgencia estimada", prioridad: resultado.prioridad, evidencia: resultado.evidencia?.[0] });
    filas.push(
      resultado.ubicacion
        ? { id: "ubicacion", etiqueta: "Ubicación detectada", valor: mayuscula(resultado.ubicacion) }
        : { id: "ubicacion", etiqueta: "Ubicación detectada", falta: "Falta indicar calle o referencia" },
    );
    (resultado.falta_informacion || []).forEach((f, i) =>
      filas.push({ id: `falta-${i}`, etiqueta: mayuscula(f), falta: "Pendiente: responde en el chat" }),
    );
  }
  return filas;
}

function Fila({ fila }) {
  const pendiente = Boolean(fila.falta);
  const Icono = iconoDeFila(fila.id);

  return (
    <div
      className={`group relative flex items-start gap-3 rounded-xl border p-2.5 transition-all ${
        pendiente
          ? "border-amber-200/90 bg-amber-50/50 shadow-2xs"
          : "border-gray-200/80 bg-white shadow-2xs hover:border-gray-300"
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg ${
          pendiente
            ? "bg-amber-100 text-amber-700"
            : "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
        }`}
      >
        {pendiente ? (
          <Icono className="h-3.5 w-3.5" strokeWidth={2.2} />
        ) : (
          <Check className="h-3.5 w-3.5" strokeWidth={2.8} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1 leading-none">
          <span className="text-2xs font-semibold uppercase tracking-wider text-gray-500">
            {fila.etiqueta}
          </span>
          {fila.prioridad && <InsigniaUrgencia prioridad={fila.prioridad} />}
        </div>

        {pendiente && (
          <div className="mt-1 text-xs font-medium text-amber-800">
            {fila.falta}
          </div>
        )}

        {fila.valor && (
          <div className="mt-1 text-sm font-semibold text-gray-900 leading-snug">
            {fila.valor}
          </div>
        )}

        {fila.evidencia && (
          <div className="mt-1.5 text-xs text-gray-600">
            Detectado por:{" "}
            <mark className="rounded-xs bg-amber-100/90 px-1 py-0.5 text-xs font-medium text-amber-950">
              "{fila.evidencia}"
            </mark>
          </div>
        )}
      </div>
    </div>
  );
}

/** Estado inicial minimalista y orientador (sin skeletons grises ni jerga de "en vivo") */
const PASOS_GUIA = [
  { id: "guia-residuo", Icono: Tag, titulo: "Qué residuo encontraste", detalle: "Escombros, muebles, ramas, bolsas…" },
  { id: "guia-ubicacion", Icono: Compass, titulo: "Dónde está ubicado", detalle: "Calle, esquina o punto de referencia" },
  { id: "guia-sector", Icono: MapPin, titulo: "Sector de Rancagua", detalle: "Lo podrás elegir con un clic en el chat" },
];

function GuiaInicialReporte() {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
      <p className="text-xs font-medium text-gray-600 leading-relaxed">
        A medida que converses con el asistente, aquí se completará el resumen con estos datos clave:
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {PASOS_GUIA.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-2.5 rounded-lg border border-gray-200/60 bg-white px-3 py-2 shadow-2xs"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muni-primary/10 text-muni-primary-a11y">
              <p.Icono aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-gray-800 leading-tight">{p.titulo}</span>
              <span className="block text-2xs text-gray-500">{p.detalle}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Panel "Tu reporte".
 */
export default function PanelReporte({
  filas,
  visibles,
  listos,
  total,
  completo,
  puedeEnviar,
  faltan,
  noEsResiduo,
  enviando,
  alEnviar,
}) {
  const reducir = useReducedMotion();
  const filasVisibles = filas.slice(0, visibles);

  let etiquetaBoton = "Enviar a Gestión de Calidad";
  if (enviando) etiquetaBoton = "Enviando…";
  else if (noEsResiduo) etiquetaBoton = "Este canal es solo para residuos";
  else if (!puedeEnviar) { const n = Math.max(1, faltan); etiquetaBoton += ` · falta ${n} dato${n === 1 ? "" : "s"}`; }

  return (
    <aside
      aria-labelledby="t-panel"
      className="flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs"
    >
      {/* Encabezado del panel */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div>
          <h2 id="t-panel" className="text-sm sm:text-base font-bold tracking-tight text-gray-900">
            Tu reporte
          </h2>
          <p className="text-xs text-gray-500">Resumen para Gestión de Calidad</p>
        </div>

        {completo && (
          <span
            role="status"
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700"
          >
            <CircleCheckBig aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.4} />
            Listo
          </span>
        )}
      </div>

      {/* Barra de progreso sutil */}
      <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-gray-100">
        <motion.span
          className={`block h-full rounded-full transition-colors ${
            completo ? "bg-emerald-500" : "bg-muni-primary-a11y"
          }`}
          initial={false}
          animate={{ width: `${(listos / total) * 100}%` }}
          transition={reducir ? { duration: 0 } : { duration: 0.35 }}
        />
      </div>

      {/* Lista de campos o guía inicial */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
        {filasVisibles.length === 0 ? (
          <GuiaInicialReporte />
        ) : (
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {filasVisibles.map((f) => (
                <motion.li
                  key={f.id}
                  layout={!reducir}
                  initial={reducir ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducir ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Fila fila={f} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Acciones del panel */}
      <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
        <button
          type="button"
          disabled={!puedeEnviar || enviando}
          onClick={alEnviar}
          className={
            puedeEnviar && !enviando
              ? `inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-muni-primary-a11y px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors hover:bg-muni-primary-700 ${FOCO}`
              : "inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-400"
          }
        >
          <Send aria-hidden="true" className="h-4 w-4" />
          <span>{etiquetaBoton}</span>
        </button>

        <p className="flex items-center justify-center gap-1.5 text-center text-2xs text-gray-500">
          <Info aria-hidden="true" className="h-3 w-3 shrink-0 text-gray-400" />
          <span>El encargado municipal revisará la ficha antes de despachar la cuadrilla.</span>
        </p>
      </div>
    </aside>
  );
}
