import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BarChart3, ChevronDown, MapPin } from "lucide-react";
import { cargarBandeja, decidirReporte } from "../fuente";
import MensajeError from "../components/MensajeError";
import MapaSectores from "../components/encargado/MapaSectores";
import ModalIndicadores from "../components/encargado/ModalIndicadores";
import TarjetaReporte from "../components/encargado/TarjetaReporte";
import { ORDEN_PRIORIDAD } from "../components/encargado/textos";

const prioridadDe = (r) => r.analisis?.resultado?.prioridad;

/** Vista minimalista del encargado de Gestión de Calidad: mapa de puntos calientes + bandeja + modal de KPIs. */
export default function VistaEncargado() {
  const reducir = useReducedMotion();
  const [bandeja, setBandeja] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [sector, setSector] = useState(null); // null = todos los sectores
  const [abierto, setAbierto] = useState(null);
  const [modalKpi, setModalKpi] = useState(false);
  const [menuSectorAbierto, setMenuSectorAbierto] = useState(false);
  const dropdownRef = useRef(null);
  const [decisiones, setDecisiones] = useState({}); // id → { estado, decidido_en }
  const [enviando, setEnviando] = useState({}); // id → "aprobar" | "rechazar"
  const [erroresDecision, setErroresDecision] = useState({});

  const cargar = useCallback(async () => {
    setErrorCarga(null);
    try {
      const { datos } = await cargarBandeja({});
      setBandeja(datos);
    } catch (e) {
      setErrorCarga(e?.message || "No se pudo cargar la bandeja.");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Cerrar modal o dropdown con Escape o clic afuera
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setModalKpi(false);
        setMenuSectorAbierto(false);
      }
    };
    const onClickAfuera = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuSectorAbierto(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickAfuera);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickAfuera);
    };
  }, []);

  const reportes = bandeja?.reportes || [];
  const pendientes = useMemo(
    () => reportes.filter((r) => r.estado === "pendiente" && !decisiones[r.id]),
    [reportes, decisiones],
  );

  // por_sector recalculado localmente tras cada decisión
  const porSector = useMemo(
    () =>
      (bandeja?.por_sector || []).map((s) => {
        const delSector = pendientes.filter((r) => r.sector?.id === s.sector_id);
        const prioridad_max = delSector.reduce(
          (max, r) => (max === null || ORDEN_PRIORIDAD[prioridadDe(r)] < ORDEN_PRIORIDAD[max] ? prioridadDe(r) : max),
          null,
        );
        return { ...s, pendientes: delSector.length, prioridad_max };
      }),
    [bandeja, pendientes],
  );

  const infoSector = porSector.find((s) => s.sector_id === sector);
  const visibles = reportes.filter((r) => (sector ? r.sector?.id === sector : true));
  const abiertoEfectivo = visibles.some((r) => r.id === abierto) ? abierto : visibles[0]?.id;

  const altas = pendientes.filter((r) => prioridadDe(r) === "alta").length;
  const aprobados =
    reportes.filter((r) => r.estado === "aprobado" && !decisiones[r.id]).length +
    Object.values(decisiones).filter((d) => d.estado === "aprobado").length;
  const masAntiguo = pendientes.reduce((min, r) => (!min || r.creado_en < min ? r.creado_en : min), null);

  async function decidir(id, decision) {
    setEnviando((e) => ({ ...e, [id]: decision }));
    setErroresDecision((e) => ({ ...e, [id]: null }));
    try {
      const { datos } = await decidirReporte(id, decision, null);
      setDecisiones((d) => ({
        ...d,
        [id]: { estado: datos?.estado || (decision === "aprobar" ? "aprobado" : "rechazado"), decidido_en: datos?.decidido_en },
      }));
    } catch (e) {
      setErroresDecision((x) => ({ ...x, [id]: e?.message || "Error desconocido." }));
    } finally {
      setEnviando((e) => ({ ...e, [id]: null }));
    }
  }

  if (errorCarga) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <MensajeError titulo="No se pudo cargar la bandeja" mensaje={errorCarga} alReintentar={cargar} />
      </div>
    );
  }
  if (!bandeja) return <p className="p-8 text-sm text-gray-500" role="status">Cargando…</p>;

  const sectoresConPendientes = porSector
    .filter((s) => s.pendientes > 0)
    .sort((a, b) => ORDEN_PRIORIDAD[a.prioridad_max] - ORDEN_PRIORIDAD[b.prioridad_max] || b.pendientes - a.pendientes);

  return (
    <div className="container flex min-h-0 flex-1 flex-col overflow-hidden py-3 sm:py-4">
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4 sm:gap-5">
        {/* Columna Izquierda: Mapa de puntos calientes + selector desplegable */}
        <section className="flex min-h-0 flex-col gap-2.5 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-3">
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-gray-900">
                Mapa de sectores
              </h2>
              <ul className="hidden sm:flex items-center gap-2.5 text-2xs font-medium text-gray-500">
                <li className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-600" />
                  Alta
                </li>
                <li className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-600" />
                  Media
                </li>
                <li className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-600" />
                  Baja
                </li>
              </ul>
            </div>

            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuSectorAbierto((prev) => !prev)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs transition-all hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muni-primary-a11y"
                aria-expanded={menuSectorAbierto}
                aria-haspopup="listbox"
              >
                <MapPin className="h-3.5 w-3.5 text-muni-primary-a11y" />
                <span>{sector ? infoSector?.nombre || sector : "Todos los sectores"}</span>
                <span className="rounded-full bg-gray-100 px-1.5 py-0.2 text-2xs font-bold text-gray-600 tabular-nums">
                  {sector ? infoSector?.pendientes ?? 0 : pendientes.length}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${menuSectorAbierto ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {menuSectorAbierto && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    role="listbox"
                    className="absolute right-0 top-full z-30 mt-1.5 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={sector === null}
                      onClick={() => {
                        setSector(null);
                        setAbierto(null);
                        setMenuSectorAbierto(false);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        sector === null
                          ? "bg-muni-primary/10 font-semibold text-muni-primary-a11y"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>Todos los sectores</span>
                      <span className="rounded-full bg-gray-100 px-1.5 py-0.2 text-2xs font-bold text-gray-600 tabular-nums">
                        {pendientes.length}
                      </span>
                    </button>

                    <div className="my-1 border-t border-gray-100" />

                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {sectoresConPendientes.map((s) => {
                        const activo = sector === s.sector_id;
                        const punto =
                          s.prioridad_max === "alta"
                            ? "bg-red-500"
                            : s.prioridad_max === "media"
                              ? "bg-amber-500"
                              : "bg-slate-400";
                        return (
                          <button
                            key={s.sector_id}
                            type="button"
                            role="option"
                            aria-selected={activo}
                            onClick={() => {
                              setSector(s.sector_id);
                              setAbierto(null);
                              setMenuSectorAbierto(false);
                            }}
                            className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              activo
                                ? "bg-muni-primary/10 font-semibold text-muni-primary-a11y"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${punto}`} />
                              <span>{s.nombre}</span>
                            </span>
                            <span className="rounded-full bg-gray-100 px-1.5 py-0.2 text-2xs font-bold text-gray-600 tabular-nums">
                              {s.pendientes}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <MapaSectores
            sectores={porSector}
            seleccionado={sector}
            alSeleccionar={(id) => {
              setSector((prev) => (prev === id ? null : id));
              setAbierto(null);
            }}
          />
        </section>

        {/* Columna Derecha: Bandeja priorizada + botón de modal KPIs */}
        <section className="flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate text-sm sm:text-base font-bold tracking-tight text-gray-900">
                {sector ? infoSector?.nombre || sector : "Reportes"}
              </h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 tabular-nums">
                {visibles.length}
              </span>
              {sector && (
                <button
                  type="button"
                  onClick={() => {
                    setSector(null);
                    setAbierto(null);
                  }}
                  className="cursor-pointer text-xs font-medium text-muni-primary-a11y hover:underline"
                >
                  Ver todos
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setModalKpi(true)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200/90 bg-gray-50/80 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs transition-colors hover:bg-gray-100"
            >
              <BarChart3 aria-hidden="true" className="h-3.5 w-3.5 text-muni-primary-a11y" />
              <span>Indicadores</span>
              {altas > 0 && (
                <span className="rounded-full bg-red-100 px-1.5 py-0.2 text-2xs font-bold text-red-700 tabular-nums">
                  {altas}
                </span>
              )}
            </button>
          </div>

          {visibles.length === 0 ? (
            <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
              Sin reportes en este sector.
            </div>
          ) : (
            <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
              {visibles.map((r) => (
                <motion.li
                  key={r.id}
                  layout={!reducir}
                  className="shrink-0"
                  transition={{ duration: 0.16 }}
                >
                  <TarjetaReporte
                    reporte={r}
                    expandido={r.id === abiertoEfectivo}
                    alExpandir={() => setAbierto(r.id)}
                    decision={decisiones[r.id]}
                    enviando={enviando[r.id]}
                    error={erroresDecision[r.id]}
                    alDecidir={(d) => decidir(r.id, d)}
                  />
                </motion.li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Modal amplio de Indicadores (KPIs y gráficos con datos reales de la BD) */}
      <AnimatePresence>
        {modalKpi && (
          <ModalIndicadores
            reportes={reportes}
            pendientes={pendientes}
            porSector={porSector}
            altas={altas}
            aprobados={aprobados}
            masAntiguo={masAntiguo}
            alCerrar={() => setModalKpi(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
