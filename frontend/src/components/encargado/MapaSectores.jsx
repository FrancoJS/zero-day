import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertTriangle, ArrowDown, Clock, Info, WifiOff } from "lucide-react";
import { ESTILO_PRIORIDAD } from "./textos";

import { CONFIG_MAPA } from "./configMapa";

const CENTRO = CONFIG_MAPA.centro;

// Glifos SVG (mismos íconos que lucide) para el HTML del divIcon.
const GLIFO = {
  alta: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  media: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  baja: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
};

// "Mapa de calor" por sector: zona semitransparente bajo cada marcador (sin plugin).
const RADIO_ZONA_M = 800; // los sectores vecinos están a ~1,8–2 km: casi no se superponen
const COLOR_ZONA = { alta: "#991B1B", media: "#92400E", baja: "#6B7280" };
const COLOR_SIN_PENDIENTES = "#9CA3AF";

function estiloZona(s, seleccionado) {
  const color = s.pendientes ? COLOR_ZONA[s.prioridad_max] || COLOR_ZONA.baja : COLOR_SIN_PENDIENTES;
  return {
    radius: RADIO_ZONA_M,
    color: seleccionado ? "#AE0101" : color,
    weight: seleccionado ? 3 : 1.5,
    opacity: seleccionado ? 0.9 : 0.5,
    fillColor: color,
    fillOpacity: s.pendientes ? 0.12 + 0.12 * Math.min(s.pendientes, 4) : 0.08,
  };
}

function iconoSector(s, seleccionado) {
  if (!s.pendientes) {
    return L.divIcon({
      className: "",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#4B5563;opacity:.55;border:2px solid white"></span>`,
    });
  }
  const p = ESTILO_PRIORIDAD[s.prioridad_max] ? s.prioridad_max : "baja";
  const anillo = seleccionado ? "box-shadow:0 0 0 4px white,0 0 0 7px #AE0101;" : "box-shadow:0 0 0 2px white,0 1px 4px rgba(0,0,0,.35);";
  return L.divIcon({
    className: "",
    iconSize: [64, 32],
    iconAnchor: [32, 16],
    html: `<span style="display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:9999px;background:${ESTILO_PRIORIDAD[p].hex};color:white;font:700 15px 'Open Sans',sans-serif;${anillo}cursor:pointer;white-space:nowrap">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLIFO[p]}</svg>${s.pendientes}</span>`,
  });
}

/** Mapa Leaflet + OSM con un marcador por sector (S6). Si los tiles fallan, lista por sector. */
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
    L.tileLayer(CONFIG_MAPA.tiles.url, { attribution: CONFIG_MAPA.tiles.atribucion, maxZoom: CONFIG_MAPA.tiles.zoomMaximo })
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

  // Ajustar a los puntos solo cuando cambia el conjunto de sectores.
  const claveSectores = sectores.map((s) => s.sector_id).join(",");
  useEffect(() => {
    const m = mapa.current;
    if (!m || !sectores.length) return;
    const limites = L.latLngBounds(sectores.map((s) => [s.lat, s.lng]));
    m.fitBounds(limites, { padding: CONFIG_MAPA.margenAjuste, maxZoom: CONFIG_MAPA.zoomMaximoAjuste });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveSectores, sinConexion]);

  useEffect(() => {
    const grupo = capa.current;
    if (!grupo) return;
    grupo.clearLayers();
    sectores.forEach((s) => {
      const zona = L.circle([s.lat, s.lng], { ...estiloZona(s, s.sector_id === seleccionado), interactive: Boolean(s.pendientes) });
      if (s.pendientes) zona.on("click", () => alSel.current(s.sector_id));
      zona.addTo(grupo);
    });
    sectores.forEach((s) => {
      const marcador = L.marker([s.lat, s.lng], {
        icon: iconoSector(s, s.sector_id === seleccionado),
        keyboard: true,
        title: `${s.nombre}: ${s.pendientes ? `${s.pendientes} pendientes` : "Sin pendientes"}`,
        zIndexOffset: s.sector_id === seleccionado ? 1000 : s.pendientes ? 500 : 0,
      });
      marcador.bindTooltip(s.pendientes ? s.nombre : `${s.nombre} · Sin pendientes`, {
        direction: "bottom",
        offset: [0, 14],
        permanent: Boolean(s.pendientes),
        className: "",
      });
      if (s.pendientes) marcador.on("click", () => alSel.current(s.sector_id));
      marcador.addTo(grupo);
    });
  }, [sectores, seleccionado, sinConexion]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {sinConexion ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <WifiOff aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-adv" />
            <p><b className="font-semibold">Mapa sin conexión:</b> usa la lista por sector.</p>
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
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muni-primary-a11y focus-visible:ring-offset-2 disabled:text-gray-500 ${
                      s.sector_id === seleccionado ? "border-muni-primary-a11y bg-muni-primary-50" : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span>{s.nombre}</span>
                    {s.pendientes ? (
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs tabular-nums ${est?.clases || ""}`}>
                        {est?.texto} · {s.pendientes}
                      </span>
                    ) : (
                      <span className="text-xs font-normal">Sin pendientes</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div ref={nodo} className="z-0 min-h-[360px] flex-1 overflow-hidden rounded-xl border border-gray-200" aria-label="Mapa de reportes pendientes por sector" />
      )}
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-700">
        <li className="flex items-center gap-2"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-critico text-white"><AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" /></span>Hay prioridad alta</li>
        <li className="flex items-center gap-2"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-adv text-white"><Clock aria-hidden="true" className="h-3.5 w-3.5" /></span>Máximo media</li>
        <li className="flex items-center gap-2"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-600 text-white"><ArrowDown aria-hidden="true" className="h-3.5 w-3.5" /></span>Solo baja</li>
        <li className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-gray-600/60" />Sin pendientes</li>
        <li>Número = reportes pendientes</li>
        <li className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded-full border border-critico/50 bg-critico/30" />Intensidad = cantidad de reportes pendientes</li>
      </ul>
      <p className="flex items-center gap-2 text-sm text-gray-600">
        <Info aria-hidden="true" className="h-4 w-4" />
        Ubicación por sector aproximada (simulado) · mapa © OpenStreetMap
      </p>
    </div>
  );
}
