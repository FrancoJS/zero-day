import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { WifiOff } from "lucide-react";
import { ESTILO_PRIORIDAD } from "./textos";
import { CONFIG_MAPA } from "./configMapa";

const CENTRO = CONFIG_MAPA.centro;

// Colores vivos para que los puntos calientes destaquen sobre el mapa desaturado
const COLOR_CALOR = {
  alta: { halo: "#EF4444", nucleo: "#DC2626", badge: "#B91C1C" },
  media: { halo: "#F59E0B", nucleo: "#D97706", badge: "#B45309" },
  baja: { halo: "#64748B", nucleo: "#475569", badge: "#334155" },
};

/**
 * Calcula el radio del punto caliente según la cantidad de reportes y prioridad,
 * evitando que todos los sectores tengan el mismo círculo rígido.
 */
function radioCalor(s) {
  if (!s.pendientes) return 220;
  const pesoPrioridad = s.prioridad_max === "alta" ? 180 : s.prioridad_max === "media" ? 90 : 0;
  return Math.min(820, 340 + s.pendientes * 110 + pesoPrioridad);
}

function iconoSector(s, seleccionado) {
  if (!s.pendientes) {
    return L.divIcon({
      className: "",
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      html: `<span style="display:block;width:10px;height:10px;border-radius:9999px;background:#94A3B8;border:2px solid white;box-shadow:0 1px 2px rgba(0,0,0,.2)"></span>`,
    });
  }

  const p = COLOR_CALOR[s.prioridad_max] ? s.prioridad_max : "baja";
  const paleta = COLOR_CALOR[p];
  const esCritico = p === "alta" || s.pendientes >= 3;
  const tam = esCritico ? 34 : p === "media" ? 30 : 26;
  const anillo = seleccionado
    ? `box-shadow:0 0 0 3px white, 0 0 0 6px #AE0101, 0 4px 12px rgba(0,0,0,.25);transform:scale(1.08);`
    : `box-shadow:0 0 0 2.5px white, 0 3px 8px rgba(0,0,0,.22);`;

  const pulso =
    p === "alta"
      ? `<span style="position:absolute;inset:-6px;border-radius:9999px;background:${paleta.halo};opacity:0.28;pointer-events:none;"></span>`
      : "";

  const etiqueta = seleccionado
    ? `<span style="position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:5px;padding:2px 7px;border-radius:6px;background:#111827;color:white;font:600 11px 'Open Sans',sans-serif;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,.2)">${s.nombre}</span>`
    : "";

  return L.divIcon({
    className: "",
    iconSize: [tam, tam],
    iconAnchor: [tam / 2, tam / 2],
    html: `<div style="position:relative;display:grid;place-items:center;width:${tam}px;height:${tam}px;border-radius:9999px;background:${paleta.badge};color:white;font:700 ${esCritico ? 14 : 12}px 'Open Sans',sans-serif;${anillo}cursor:pointer;transition:transform .15s ease">
      ${pulso}
      <span style="position:relative">${s.pendientes}</span>
      ${etiqueta}
    </div>`,
  });
}

/** Mapa Leaflet minimalista con puntos calientes por sector. */
export default function MapaSectores({ sectores, seleccionado, alSeleccionar }) {
  const nodo = useRef(null);
  const mapa = useRef(null);
  const capa = useRef(null);
  const alSel = useRef(alSeleccionar);
  alSel.current = alSeleccionar;
  const [sinConexion, setSinConexion] = useState(typeof navigator !== "undefined" && navigator.onLine === false);

  useEffect(() => {
    if (sinConexion || !nodo.current) return undefined;
    const m = L.map(nodo.current, { zoomControl: true, attributionControl: true }).setView(CENTRO, CONFIG_MAPA.zoomInicial);
    let cargados = 0;
    let errores = 0;
    L.tileLayer(CONFIG_MAPA.tiles.url, {
      attribution: CONFIG_MAPA.tiles.atribucion,
      maxZoom: CONFIG_MAPA.tiles.zoomMaximo,
    })
      .on("tileload", () => (cargados += 1))
      .on("tileerror", () => {
        errores += 1;
        if (cargados === 0 && errores >= 4) setSinConexion(true);
      })
      .addTo(m);
    capa.current = L.layerGroup().addTo(m);
    mapa.current = m;
    const t1 = setTimeout(() => m.invalidateSize(), 50);
    const t2 = setTimeout(() => m.invalidateSize(), 400);
    const obs = new ResizeObserver(() => m.invalidateSize());
    obs.observe(nodo.current);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      obs.disconnect();
      m.remove();
      mapa.current = null;
    };
  }, [sinConexion]);

  const claveSectores = sectores.map((s) => s.sector_id).join(",");
  useEffect(() => {
    const m = mapa.current;
    if (!m || !sectores.length) return;
    const limites = L.latLngBounds(sectores.map((s) => [s.lat, s.lng]));
    m.fitBounds(limites, { padding: [36, 36], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveSectores, sinConexion]);

  useEffect(() => {
    const grupo = capa.current;
    if (!grupo) return;
    grupo.clearLayers();

    // 1. Capas de calor (doble halo suave sin bordes duros para representar puntos calientes)
    sectores.forEach((s) => {
      if (!s.pendientes) return;
      const p = COLOR_CALOR[s.prioridad_max] ? s.prioridad_max : "baja";
      const paleta = COLOR_CALOR[p];
      const r = radioCalor(s);
      const activo = s.sector_id === seleccionado;

      // Halo exterior difuso
      const haloExterior = L.circle([s.lat, s.lng], {
        radius: r,
        stroke: activo,
        color: "#AE0101",
        weight: 1.5,
        dashArray: activo ? "4 4" : undefined,
        fillColor: paleta.halo,
        fillOpacity: p === "alta" ? 0.18 : p === "media" ? 0.14 : 0.1,
        interactive: true,
      });
      haloExterior.on("click", () => alSel.current(s.sector_id));
      haloExterior.addTo(grupo);

      // Núcleo caliente interior
      const nucleo = L.circle([s.lat, s.lng], {
        radius: r * 0.48,
        stroke: false,
        fillColor: paleta.nucleo,
        fillOpacity: p === "alta" ? 0.28 : p === "media" ? 0.22 : 0.15,
        interactive: false,
      });
      nucleo.addTo(grupo);
    });

    // 2. Marcadores limpios (tooltip solo al pasar el cursor si no está seleccionado)
    sectores.forEach((s) => {
      const activo = s.sector_id === seleccionado;
      const marcador = L.marker([s.lat, s.lng], {
        icon: iconoSector(s, activo),
        keyboard: true,
        title: `${s.nombre} (${s.pendientes})`,
        zIndexOffset: activo ? 1000 : s.prioridad_max === "alta" ? 700 : s.pendientes ? 400 : 0,
      });
      if (!activo) {
        marcador.bindTooltip(`${s.nombre} · ${s.pendientes}`, {
          direction: "top",
          offset: [0, -14],
          permanent: false,
        });
      }
      if (s.pendientes) marcador.on("click", () => alSel.current(s.sector_id));
      marcador.addTo(grupo);
    });
  }, [sectores, seleccionado, sinConexion]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {sinConexion ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div role="status" className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <WifiOff aria-hidden="true" className="h-4 w-4 shrink-0 text-adv" />
            <span>Mapa sin conexión</span>
          </div>
          <ul className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-auto">
            {sectores.map((s) => {
              const est = ESTILO_PRIORIDAD[s.prioridad_max];
              return (
                <li key={s.sector_id}>
                  <button
                    type="button"
                    disabled={!s.pendientes}
                    onClick={() => alSeleccionar(s.sector_id)}
                    aria-pressed={s.sector_id === seleccionado}
                    className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muni-primary-a11y disabled:text-gray-400 ${
                      s.sector_id === seleccionado ? "border-muni-primary-a11y bg-muni-primary-50" : "border-gray-200/80 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span>{s.nombre}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-2xs tabular-nums ${s.pendientes ? est?.clases || "" : "border-gray-200 text-gray-400"}`}>
                      {s.pendientes}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div
          ref={nodo}
          className="z-0 min-h-[220px] flex-1 overflow-hidden rounded-xl border border-gray-200/80 bg-gray-100"
          aria-label="Mapa de sectores"
        />
      )}
    </div>
  );
}
