import { useEffect, useState } from "react";

// Kostra puede tardar: si pasa este umbral se muestra el aviso de espera larga (Cargando y RazonamientoEnVivo).
export const SEGUNDOS_ESPERA_LARGA = 20;

/**
 * Milisegundos desde que `activo` pasó a true (se reinicia en cada activación; se congela al terminar).
 * @param {boolean} activo
 * @param {number} [pasoMs=100]  cada cuánto se actualiza
 */
export default function useTiempoTranscurrido(activo, pasoMs = 100) {
  const [ms, setMs] = useState(0);

  useEffect(() => {
    if (!activo) return undefined;
    const inicio = performance.now();
    setMs(0);
    const intervalo = setInterval(() => setMs(performance.now() - inicio), pasoMs);
    return () => clearInterval(intervalo);
  }, [activo, pasoMs]);

  return ms;
}

/** 3100 → "3,1" (formato chileno, un decimal). */
export function segundosLegibles(ms) {
  return (ms / 1000).toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
