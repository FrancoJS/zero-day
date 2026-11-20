import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Inbox, MapPin } from "lucide-react";
import { cargarBandeja, decidirReporte } from "../fuente";
import MensajeError from "../components/MensajeError";
import MapaSectores from "../components/encargado/MapaSectores";
import TarjetaReporte from "../components/encargado/TarjetaReporte";
import { ORDEN_PRIORIDAD, espera } from "../components/encargado/textos";

const prioridadDe = (r) => r.analisis?.resultado?.prioridad;

/** Vista del encargado de Gestión de Calidad (S5 + S6): mapa por sector + bandeja + aprobación simulada. */
export default function VistaEncargado() {
  const reducir = useReducedMotion();
  const [bandeja, setBandeja] = useState(null);
  const [ejemplo, setEjemplo] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);
  const [sector, setSector] = useState(undefined); // undefined = por defecto; null = todos
  const [abierto, setAbierto] = useState(null);
  const [decisiones, setDecisiones] = useState({}); // id → { estado, decidido_en }
  const [enviando, setEnviando] = useState({}); // id → "aprobar" | "rechazar"
  const [erroresDecision, setErroresDecision] = useState({});

  const cargar = useCallback(async () => {
    setErrorCarga(null);
    try {
      const { datos, ejemplo: ej } = await cargarBandeja({ estado: "pendiente" });
      setBandeja(datos);
      setEjemplo(ej);
    } catch (e) {
      setErrorCarga(e?.message || "No se pudo cargar la bandeja.");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const reportes = bandeja?.reportes || [];
  const pendientes = useMemo(
    () => reportes.filter((r) => r.estado === "pendiente" && !decisiones[r.id]),
    [reportes, decisiones],
  );

  // por_sector recalculado localmente tras cada decisión (lat/lng vienen del backend).
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

  const sectorPorDefecto = useMemo(() => {
    const con = porSector.filter((s) => s.pendientes > 0);
    con.sort((a, b) => ORDEN_PRIORIDAD[a.prioridad_max] - ORDEN_PRIORIDAD[b.prioridad_max] || b.pendientes - a.pendientes);
    return con[0]?.sector_id ?? null;
  }, [bandeja]); // eslint-disable-line react-hooks/exhaustive-deps

  const sectorActivo = sector === undefined ? sectorPorDefecto : sector;
  const infoSector = porSector.find((s) => s.sector_id === sectorActivo);
  const visibles = reportes.filter((r) => (sectorActivo ? r.sector?.id === sectorActivo : true));
  const abiertoEfectivo = visibles.some((r) => r.id === abierto) ? abierto : visibles[0]?.id;

  const altas = pendientes.filter((r) => prioridadDe(r) === "alta").length;
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
  if (!bandeja) return <p className="p-8 text-gray-600" role="status">Cargando bandeja…</p>;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-gray-200 bg-white">
        <div className="container flex items-center gap-3 py-3 text-base">
        <Inbox aria-hidden="true" className="h-5 w-5 text-gray-700" />
        <span className="font-semibold tabular-nums">{pendientes.length} reportes pendientes</span>
        <span className="text-gray-300" aria-hidden="true">·</span>
        <span className="font-semibold tabular-nums text-muni-primary-a11y">{altas} de prioridad alta</span>
        {masAntiguo && (
          <>
            <span className="text-gray-300" aria-hidden="true">·</span>
            <span className="text-gray-700">el más antiguo espera <b className="font-semibold text-gray-900">{espera(masAntiguo)}</b></span>
          </>
        )}
        {ejemplo && (
          <span className="ml-auto rounded-full border border-adv-borde bg-adv-fondo px-3 py-1 text-sm font-semibold text-adv">
            Datos de ejemplo (backend pendiente)
          </span>
        )}
      </div>

        </div>
      <div className="container grid min-h-0 flex-1 grid-cols-[58fr_42fr] gap-5 py-6">
        <section className="flex min-h-0 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Reportes pendientes por sector</h2>
          <p className="mb-3 text-sm text-gray-600">Toca un marcador para ver los reportes de ese sector.</p>
          <MapaSectores sectores={porSector} seleccionado={sectorActivo} alSeleccionar={(id) => { setSector(id); setAbierto(null); }} />
        </section>

        <section className="flex min-h-0 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wider text-gray-600">
            {sectorActivo ? "Sector seleccionado" : "Todos los sectores"}
          </p>
          <div className="mb-3 mt-1 flex items-center gap-2">
            <MapPin aria-hidden="true" className="h-5 w-5 text-muni-primary-a11y" />
            <h2 className="text-xl font-bold tabular-nums text-gray-900">
              {sectorActivo ? `${infoSector?.nombre || sectorActivo} · ${infoSector?.pendientes ?? 0} pendientes` : `${pendientes.length} pendientes`}
            </h2>
            {sectorActivo && (
              <button
                type="button"
                onClick={() => { setSector(null); setAbierto(null); }}
                className="ml-auto text-sm font-semibold text-muni-primary-a11y underline underline-offset-2 hover:text-muni-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muni-primary-a11y"
              >
                Ver todos
              </button>
            )}
          </div>
          {visibles.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-600">No hay reportes pendientes aquí.</p>
          ) : (
            <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
              {visibles.map((r) => (
                <motion.li
                  key={r.id}
                  layout={!reducir}
                  className="shrink-0"
                  transition={{ duration: 0.18 }}
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
    </div>
  );
}
