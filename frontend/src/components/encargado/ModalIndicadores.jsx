import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CircleCheck, Clock, Inbox, Truck, X } from "lucide-react";
import { ACCION, TIPO_RESIDUO } from "./textos";

const COLOR_PRIORIDAD = {
  alta: { etiqueta: "Alta", hex: "#DC2626", barra: "bg-red-600", punto: "bg-red-600", texto: "text-red-700" },
  media: { etiqueta: "Media", hex: "#D97706", barra: "bg-amber-500", punto: "bg-amber-500", texto: "text-amber-700" },
  baja: { etiqueta: "Baja", hex: "#475569", barra: "bg-slate-500", punto: "bg-slate-500", texto: "text-slate-700" },
};

function esperaCompacta(iso) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return { valor: min, unidad: "min" };
  const horas = Math.round(min / 60);
  if (horas < 48) return { valor: horas, unidad: "h" };
  return { valor: Math.round(horas / 24), unidad: "d" };
}

/** Gráfico de anillo SVG + barras de proporción y estado general calculados 100% con datos reales de la BD */
function GraficoDonutPrioridad({ conteos, total, aprobados, rechazados, totalReportes }) {
  const radio = 46;
  const circunferencia = 2 * Math.PI * radio;
  let acumulado = 0;

  const segmentos = ["alta", "media", "baja"].map((clave) => {
    const cantidad = conteos[clave] || 0;
    const fraccion = total > 0 ? cantidad / total : 0;
    const largo = fraccion * circunferencia;
    const offset = -acumulado;
    acumulado += largo;
    return {
      clave,
      cantidad,
      porcentaje: total > 0 ? Math.round(fraccion * 100) : 0,
      largo,
      offset,
      ...COLOR_PRIORIDAD[clave],
    };
  });

  return (
    <div className="flex flex-1 flex-col justify-between gap-4">
      <div className="flex items-center gap-6">
        <div className="relative grid h-36 w-36 shrink-0 place-items-center">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={radio} fill="none" stroke="#E5E7EB" strokeWidth="14" />
            {total > 0 &&
              segmentos.map((s) =>
                s.cantidad > 0 ? (
                  <circle
                    key={s.clave}
                    cx="60"
                    cy="60"
                    r={radio}
                    fill="none"
                    stroke={s.hex}
                    strokeWidth="14"
                    strokeDasharray={`${s.largo} ${circunferencia}`}
                    strokeDashoffset={s.offset}
                    strokeLinecap="butt"
                  />
                ) : null,
              )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{total}</span>
            <span className="mt-1 text-2xs font-medium text-gray-400">pendientes</span>
          </div>
        </div>

        <ul className="flex-1 space-y-3">
          {segmentos.map((s) => (
            <li key={s.clave} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.punto}`} />
                  <span className="font-medium text-gray-700">{s.etiqueta}</span>
                </div>
                <div className="flex items-center gap-1.5 tabular-nums">
                  <span className="font-bold text-gray-900">{s.cantidad}</span>
                  <span className="text-2xs text-gray-400">({s.porcentaje}%)</span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200/70">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${s.barra}`}
                  style={{ width: `${s.porcentaje}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Barra apilada de estado general de la bandeja */}
      <div className="rounded-lg border border-gray-200/70 bg-white p-3">
        <div className="mb-1.5 flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-gray-400">
          <span>Estado de resolución</span>
          <span className="tabular-nums text-gray-600">{totalReportes} totales</span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
          {totalReportes > 0 && (
            <>
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${(total / totalReportes) * 100}%` }}
                title={`Pendientes: ${total}`}
              />
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(aprobados / totalReportes) * 100}%` }}
                title={`Aprobados: ${aprobados}`}
              />
              <div
                className="h-full bg-gray-400 transition-all duration-300"
                style={{ width: `${(rechazados / totalReportes) * 100}%` }}
                title={`Rechazados: ${rechazados}`}
              />
            </>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between text-2xs text-gray-600 tabular-nums">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Pendientes: <b>{total}</b>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Aprobados: <b>{aprobados}</b>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            Rechazados: <b>{rechazados}</b>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal amplio de Indicadores (KPIs y gráficos alimentados exclusivamente de los registros en BD).
 */
export default function ModalIndicadores({
  reportes,
  pendientes,
  porSector,
  altas,
  aprobados,
  masAntiguo,
  alCerrar,
}) {
  const reducir = useReducedMotion();

  // 1. Conteo real por prioridad (sobre pendientes)
  const porPrioridad = useMemo(() => {
    const c = { alta: 0, media: 0, baja: 0 };
    pendientes.forEach((r) => {
      const p = r.analisis?.resultado?.prioridad || "baja";
      c[p] = (c[p] || 0) + 1;
    });
    return c;
  }, [pendientes]);

  // 2. Conteo real por tipo de residuo (sobre todos los reportes en BD)
  const porTipo = useMemo(() => {
    const mapa = {};
    reportes.forEach((r) => {
      const t = r.analisis?.resultado?.tipo_residuo || "domiciliario";
      mapa[t] = (mapa[t] || 0) + 1;
    });
    const max = Math.max(1, ...Object.values(mapa));
    return Object.entries(mapa)
      .map(([id, cantidad]) => ({
        id,
        etiqueta: TIPO_RESIDUO[id] || id,
        cantidad,
        porcentajeBarra: Math.round((cantidad / max) * 100),
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [reportes]);

  // 3. Conteo real por acción/recurso sugerido (sobre pendientes)
  const porAccion = useMemo(() => {
    const mapa = {};
    pendientes.forEach((r) => {
      const a = r.analisis?.resultado?.accion_sugerida || "cuadrilla_estandar";
      mapa[a] = (mapa[a] || 0) + 1;
    });
    const max = Math.max(1, ...Object.values(mapa));
    return Object.entries(mapa)
      .map(([id, cantidad]) => ({
        id,
        etiqueta: ACCION[id] || id,
        cantidad,
        porcentajeBarra: Math.round((cantidad / max) * 100),
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [pendientes]);

  // 4. Sectores ordenados por carga real en BD
  const sectoresOrdenados = useMemo(() => {
    const max = Math.max(1, ...porSector.map((s) => s.pendientes));
    return [...porSector]
      .sort((a, b) => b.pendientes - a.pendientes || a.nombre.localeCompare(b.nombre))
      .map((s) => ({
        ...s,
        porcentajeBarra: s.pendientes > 0 ? Math.round((s.pendientes / max) * 100) : 0,
      }));
  }, [porSector]);

  const rechazados = Math.max(0, reportes.length - pendientes.length - aprobados);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-kpi"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={alCerrar}
        className="fixed inset-0 bg-gray-900/45 backdrop-blur-xs"
      />
      <motion.div
        initial={reducir ? false : { opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reducir ? undefined : { opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.18 }}
        className="relative z-10 flex max-h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        {/* Cabecera */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 id="titulo-modal-kpi" className="text-base font-bold text-gray-900">
            Indicadores de la bandeja
          </h3>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar indicadores"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Cuerpo con scroll interno si la pantalla es baja */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* Fila superior: 4 KPIs principales */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <TarjetaKpi etiqueta="Pendientes" valor={pendientes.length} Icono={Inbox} />
            <TarjetaKpi etiqueta="Prioridad alta" valor={altas} Icono={AlertTriangle} tono="text-critico" />
            <TarjetaKpi
              etiqueta="Mayor espera"
              {...(masAntiguo ? esperaCompacta(masAntiguo) : { valor: "—" })}
              Icono={Clock}
            />
            <TarjetaKpi etiqueta="Aprobados" valor={aprobados} Icono={CircleCheck} tono="text-emerald-600" />
          </div>

          {/* Grilla de gráficos (2x2) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* 1. Gráfico de anillo: Pendientes por prioridad */}
            <div className="flex flex-col rounded-xl border border-gray-200/80 bg-gray-50/40 p-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                Pendientes por prioridad
              </h4>
              <GraficoDonutPrioridad
                conteos={porPrioridad}
                total={pendientes.length}
                aprobados={aprobados}
                rechazados={rechazados}
                totalReportes={reportes.length}
              />
            </div>

            {/* 2. Gráfico de barras: Pendientes por sector */}
            <div className="rounded-xl border border-gray-200/80 bg-gray-50/40 p-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                Carga pendiente por sector
              </h4>
              <ul className="space-y-2">
                {sectoresOrdenados.map((s) => {
                  const colorBarra =
                    s.prioridad_max === "alta"
                      ? "bg-red-600"
                      : s.prioridad_max === "media"
                        ? "bg-amber-500"
                        : "bg-slate-500";
                  return (
                    <li key={s.sector_id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-700">{s.nombre}</span>
                        <span className="font-bold text-gray-900 tabular-nums">{s.pendientes}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200/70">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${colorBarra}`}
                          style={{ width: `${s.porcentajeBarra}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* 3. Gráfico de barras: Tipos de residuo en BD */}
            <div className="rounded-xl border border-gray-200/80 bg-gray-50/40 p-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                Reportes por tipo de residuo
              </h4>
              {porTipo.length === 0 ? (
                <p className="text-xs text-gray-400">Sin datos</p>
              ) : (
                <ul className="space-y-2.5">
                  {porTipo.map((t) => (
                    <li key={t.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-700">{t.etiqueta}</span>
                        <span className="font-bold text-gray-900 tabular-nums">{t.cantidad}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200/70">
                        <div
                          className="h-full rounded-full bg-muni-primary-a11y transition-all duration-300"
                          style={{ width: `${t.porcentajeBarra}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 4. Gráfico de barras: Recursos requeridos (acción sugerida en pendientes) */}
            <div className="rounded-xl border border-gray-200/80 bg-gray-50/40 p-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                Recursos requeridos (pendientes)
              </h4>
              {porAccion.length === 0 ? (
                <p className="text-xs text-gray-400">Sin despachos pendientes</p>
              ) : (
                <ul className="space-y-2.5">
                  {porAccion.map((a) => (
                    <li key={a.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-gray-700">
                          <Truck className="h-3.5 w-3.5 text-gray-400" />
                          {a.etiqueta}
                        </span>
                        <span className="font-bold text-gray-900 tabular-nums">{a.cantidad}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200/70">
                        <div
                          className="h-full rounded-full bg-gray-800 transition-all duration-300"
                          style={{ width: `${a.porcentajeBarra}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TarjetaKpi({ etiqueta, valor, unidad, Icono, tono = "text-gray-900" }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200/80 bg-gray-50/60 px-4 py-3">
      <div>
        <p className="text-xs font-medium text-gray-500">{etiqueta}</p>
        <p className={`mt-1 text-2xl sm:text-3xl font-bold tabular-nums leading-none ${tono}`}>
          {valor}
          {unidad && <span className="ml-1 text-xs font-semibold text-gray-500">{unidad}</span>}
        </p>
      </div>
      <Icono aria-hidden="true" className={`h-5 w-5 ${tono === "text-gray-900" ? "text-gray-400" : tono}`} />
    </div>
  );
}
