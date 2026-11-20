import { AlertTriangle, ArrowDown, Check, CircleCheck, Clock, Lock, Truck, X } from "lucide-react";
import { ACCION, ESTILO_PRIORIDAD, TIPO_RESIDUO, haceCuanto, horaCorta } from "./textos";

const ICONO_PRIORIDAD = { alta: AlertTriangle, media: Clock, baja: ArrowDown };

export function InsigniaPrioridad({ prioridad }) {
  const est = ESTILO_PRIORIDAD[prioridad] || ESTILO_PRIORIDAD.baja;
  const Ic = ICONO_PRIORIDAD[prioridad] || ArrowDown;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-semibold ${est.clases}`}>
      <Ic aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.4} />
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
  return { salida, encontradas: rangos.length };
}

export default function TarjetaReporte({ reporte, expandido, alExpandir, decision, enviando, error, alDecidir }) {
  const r = reporte.analisis?.resultado || {};
  const evidencia = r.evidencia || [];
  const { salida, encontradas } = trozos(reporte.texto || "", evidencia);
  const pendiente = !decision && reporte.estado === "pendiente";
  const borde = expandido && r.prioridad === "alta" ? "border-critico-borde bg-critico-fondo/40 border-l-4 border-l-critico" : expandido ? "border-gray-300 border-l-4 border-l-muni-primary-a11y" : "border-gray-200";

  const cabecera = (
    <>
      <div className="flex items-center gap-2">
        <InsigniaPrioridad prioridad={r.prioridad} />
        {reporte.simulado && (
          <span className="rounded-md border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-bold tracking-wide text-gray-700">SIMULADO</span>
        )}
        <span className="ml-auto text-sm text-gray-600">{haceCuanto(reporte.creado_en)}</span>
      </div>
      <h3 className="mt-2 text-base font-bold text-gray-900">{TIPO_RESIDUO[r.tipo_residuo] || r.tipo_residuo}</h3>
    </>
  );

  if (!expandido) {
    return (
      <div>
        <button
          type="button"
          onClick={alExpandir}
          className={`w-full rounded-xl border bg-white p-4 text-left hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muni-primary-a11y focus-visible:ring-offset-2 ${borde}`}
        >
          {cabecera}
          <p className="mt-1 text-gray-700">{r.resumen}</p>
          {decision && <EstadoDecision decision={decision} />}
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border bg-white p-4 ${borde}`}>
      {cabecera}
      <p className="mt-1 leading-relaxed text-gray-800">
        {salida.map((s, i) =>
          s.ev ? (
            <mark key={i} className="rounded-sm bg-destacado px-0.5 text-gray-900 underline decoration-adv decoration-2 underline-offset-4">{s.t}</mark>
          ) : (
            <span key={i}>{s.t}</span>
          ),
        )}
      </p>
      {evidencia.length > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ok">
          <CircleCheck aria-hidden="true" className="h-4 w-4" />
          Evidencia verificada · {encontradas} de {evidencia.length}
        </p>
      )}
      {r.falta_informacion?.length > 0 && (
        <p className="mt-1 text-sm text-gray-600">Falta saber: {r.falta_informacion.join(", ")}</p>
      )}

      {pendiente ? (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Acción propuesta</p>
          <p className="mt-2 flex items-center gap-3 text-lg font-bold text-gray-900">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muni-primary-50 text-muni-primary-a11y">
              <Truck aria-hidden="true" className="h-5 w-5" />
            </span>
            {ACCION[r.accion_sugerida] || r.accion_sugerida}
          </p>
          {r.ubicacion && <p className="mt-2 text-sm text-gray-600">Ubicación indicada: {r.ubicacion}</p>}
          {error && (
            <div role="alert" className="restriccion mt-3 text-sm">
              <b className="font-semibold">No se registró la decisión.</b> {error}
            </div>
          )}
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              disabled={enviando}
              onClick={() => alDecidir("aprobar")}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-muni-primary-a11y px-4 py-3 font-semibold text-white hover:bg-muni-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muni-primary-a11y focus-visible:ring-offset-2 disabled:opacity-60"
            >
              <Check aria-hidden="true" className="h-5 w-5" />
              {enviando === "aprobar" ? "Registrando…" : "Aprobar despacho"}
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => alDecidir("rechazar")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muni-primary-a11y focus-visible:ring-offset-2 disabled:opacity-60"
            >
              <X aria-hidden="true" className="h-5 w-5" />
              {enviando === "rechazar" ? "Registrando…" : "Rechazar"}
            </button>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <Lock aria-hidden="true" className="h-4 w-4" />
            Nada se ejecuta sin tu aprobación · despacho simulado
          </p>
        </div>
      ) : (
        <EstadoDecision decision={decision || { estado: reporte.estado, decidido_en: reporte.decidido_en }} />
      )}
    </div>
  );
}

function EstadoDecision({ decision }) {
  if (decision.estado === "aprobado") {
    return (
      <p role="status" className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-ok">
        <CircleCheck aria-hidden="true" className="h-4 w-4" />
        Despacho aprobado (simulado){decision.decidido_en ? ` · ${horaCorta(decision.decidido_en)}` : ""}
      </p>
    );
  }
  return (
    <p role="status" className="mt-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
      <X aria-hidden="true" className="h-4 w-4" />
      Rechazado{decision.decidido_en ? ` · ${horaCorta(decision.decidido_en)}` : ""}
    </p>
  );
}
