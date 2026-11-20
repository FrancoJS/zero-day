// Fuente de datos de las pantallas: usa la API real (api.js) y, MIENTRAS el backend no tenga
// los endpoints de reportes (404), cae a datosEjemplo.js y lo informa con `ejemplo: true`
// para que la UI muestre "Datos de ejemplo". Nunca oculta otros errores (IA, BD, red).
import * as api from "./api";
import { BANDEJA, BORRADOR_TURNO_1, BORRADOR_TURNO_2, SECTORES } from "./datosEjemplo";

const esFaltaEndpoint = (e) => /HTTP 404|Not Found|no existe la ruta/i.test(e?.message || "");
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function conRespaldo(real, ejemplo) {
  try {
    return { datos: await real(), ejemplo: false };
  } catch (e) {
    if (!esFaltaEndpoint(e)) throw e;
    await espera(600);
    return { datos: structuredClone(ejemplo()), ejemplo: true };
  }
}

export const cargarSectores = () => conRespaldo(api.obtenerSectores, () => ({ sectores: SECTORES }));

/** `turno` = cuántas respuestas lleva el vecino (0 = primer mensaje); solo se usa en el respaldo. */
export const analizarBorrador = (texto, sectorId, turno = 0) =>
  conRespaldo(() => api.analizarBorrador(texto, sectorId), () => (turno === 0 ? BORRADOR_TURNO_1 : BORRADOR_TURNO_2));

export const enviarReporte = (texto, sectorId) =>
  conRespaldo(() => api.enviarReporte(texto, sectorId), () => ({ ...BANDEJA.reportes[0], id: 200, texto }));

export const cargarBandeja = (filtro) => conRespaldo(() => api.obtenerBandeja(filtro), () => BANDEJA);

export const decidirReporte = (id, decision, nota) =>
  conRespaldo(
    () => api.decidirReporte(id, decision, nota),
    () => ({ ...BANDEJA.reportes.find((r) => r.id === id), estado: decision === "aprobar" ? "aprobado" : "rechazado",
      decidido_en: new Date().toISOString(), nota_decision: nota }),
  );
