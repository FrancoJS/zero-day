// Prioridad del análisis → tono e ícono de Insignia. Adaptar si el desafío usa otra escala.
export const INSIGNIA_PRIORIDAD = {
  alta: { tono: "critico", icono: "error", texto: "Prioridad alta" },
  media: { tono: "adv", icono: "alerta", texto: "Prioridad media" },
  baja: { tono: "ok", icono: "check", texto: "Prioridad baja" },
};

export function insigniaPrioridad(prioridad) {
  return INSIGNIA_PRIORIDAD[prioridad] || { tono: "neutro", icono: "info", texto: `Prioridad ${prioridad}` };
}
