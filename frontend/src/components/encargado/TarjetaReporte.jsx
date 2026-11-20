import { AlertTriangle, ArrowDown, Check, CircleCheck, Clock, MapPin, Truck, X } from "lucide-react";
import { ACCION, ESTILO_PRIORIDAD, TIPO_RESIDUO, haceCuanto, horaCorta } from "./textos";

const ICONO_PRIORIDAD = { alta: AlertTriangle, media: Clock, baja: ArrowDown };

export function InsigniaPrioridad({ prioridad }) {
  const est = ESTILO_PRIORIDAD[prioridad] || ESTILO_PRIORIDAD.baja;
  const Ic = ICONO_PRIORIDAD[prioridad] || ArrowDown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-bold ${est.clases}`}>
      <Ic aria-hidden="true" className="h-3 w-3" strokeWidth={2.4} />
      {est.texto}
    </span>
  );
}

/** Divide el texto en trozos normales y trozos de evidencia (búsqueda sin distinguir mayúsculas). */
function trozos(texto, evidencia) {
  const bajo = texto.toLowerCase();
  const rangos = [];
  evidencia.forEach((ev) => {
    const i = ev ? bajo.indexOf(ev.toLowerCase()) : -1;
    if (i >= 0) rangos.push([i, i + ev.length]);
  });
  rangos.sort((a, b) => a[0] - b[0]);
  const salida = [];
  let pos = 0;
  rangos.forEach(([a, b]) => {
    if (a < pos) return;
    if (a > pos) salida.push({ t: texto.slice(pos, a) });
    salida.push({ t: texto.slice(a, b), ev: true });
    pos = b;
  });
  if (pos < texto.length) salida.push({ t: texto.slice(pos) });
  return salida;
}

export default function TarjetaReporte({ reporte, expandido, alExpandir, decision, enviando, error, alDecidir }) {
  const r = reporte.analisis?.resultado || {};
  const evidencia = r.evidencia || [];
  const salida = trozos(reporte.texto || "", evidencia);
  const estadoActual = decision?.estado || reporte.estado;
  const pendiente = estadoActual === "pendiente";

  const borde = expandido
    ? r.prioridad === "alta"
      ? "border-rose-300 bg-rose-50/20 shadow-xs"
      : "border-gray-300 bg-white shadow-xs"
    : "border-gray-200/80 bg-white hover:border-gray-300 hover:bg-gray-50/50";

  const cabecera = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <InsigniaPrioridad prioridad={r.prioridad} />
        <h3 className="truncate text-xs sm:text-sm font-semibold text-gray-900">
          {TIPO_RESIDUO[r.tipo_residuo] || r.tipo_residuo}
        </h3>
        {reporte.sector?.nombre && (
          <span className="hidden sm:inline-block rounded-md bg-gray-100 px-1.5 py-0.5 text-2xs font-medium text-gray-600">
            {reporte.sector.nombre}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!pendiente && <InsigniaDecision estado={estadoActual} />}
        <span className="text-2xs text-gray-400 tabular-nums">{haceCuanto(reporte.creado_en)}</span>
      </div>
    </div>
  );

  if (!expandido) {
    return (
      <button
        type="button"
        onClick={alExpandir}
        className={`w-full rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muni-primary-a11y ${borde}`}
      >
        {cabecera}
        <p className="mt-1.5 line-clamp-1 text-xs text-gray-500">{r.resumen}</p>
      </button>
    );
  }

  return (
    <div className={`rounded-xl border p-3.5 transition-all ${borde}`}>
      {cabecera}

      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-gray-700">
        {salida.map((s, i) =>
          s.ev ? (
            <mark key={i} className="rounded-xs bg-amber-100/90 px-1 py-0.5 font-medium text-amber-950">
              {s.t}
            </mark>
          ) : (
            <span key={i}>{s.t}</span>
          ),
        )}
      </p>

      {r.ubicacion && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="truncate">{r.ubicacion}</span>
        </p>
      )}

      {error && (
        <div role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-800">
          {error}
        </div>
      )}

      {pendiente ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muni-primary/10 text-muni-primary-a11y">
              <Truck aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
            <span>{ACCION[r.accion_sugerida] || r.accion_sugerida}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={Boolean(enviando)}
              onClick={() => alDecidir("rechazar")}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
              <span>{enviando === "rechazar" ? "…" : "Rechazar"}</span>
            </button>
            <button
              type="button"
              disabled={Boolean(enviando)}
              onClick={() => alDecidir("aprobar")}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-muni-primary-a11y px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-muni-primary-700 disabled:opacity-50"
            >
              <Check aria-hidden="true" className="h-3.5 w-3.5" />
              <span>{enviando === "aprobar" ? "…" : "Aprobar"}</span>
            </button>
          </div>
        </div>
      ) : (
        <EstadoDecision decision={decision || { estado: reporte.estado, decidido_en: reporte.decidido_en }} />
      )}
    </div>
  );
}

function InsigniaDecision({ estado }) {
  if (estado === "aprobado") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-2xs font-semibold text-emerald-700">
        <CircleCheck aria-hidden="true" className="h-3 w-3" />
        Aprobado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-2xs font-semibold text-gray-600">
      Rechazado
    </span>
  );
}

function EstadoDecision({ decision }) {
  const hora = decision.decidido_en ? ` · ${horaCorta(decision.decidido_en)}` : "";
  if (decision.estado === "aprobado") {
    return (
      <p role="status" className="mt-2.5 flex items-center gap-1.5 border-t border-gray-100 pt-2 text-xs font-semibold text-emerald-700">
        <CircleCheck aria-hidden="true" className="h-3.5 w-3.5" />
        <span>Despacho aprobado{hora}</span>
      </p>
    );
  }
  return (
    <p role="status" className="mt-2.5 flex items-center gap-1.5 border-t border-gray-100 pt-2 text-xs font-semibold text-gray-500">
      <X aria-hidden="true" className="h-3.5 w-3.5" />
      <span>Rechazado{hora}</span>
    </p>
  );
}
