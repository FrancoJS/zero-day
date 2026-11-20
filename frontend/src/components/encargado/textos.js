// Textos y utilidades de la vista encargado (S5).
export const ORDEN_PRIORIDAD = { alta: 0, media: 1, baja: 2 };

export const TIPO_RESIDUO = {
  domiciliario: "Basura domiciliaria",
  escombros: "Escombros",
  voluminoso: "Residuos voluminosos",
  poda: "Restos de poda",
  peligroso: "Residuo peligroso",
  mixto: "Escombros y voluminoso",
  no_es_residuo: "No es un residuo",
};

export const ACCION = {
  cuadrilla_estandar: "Enviar cuadrilla",
  camion_tolva: "Enviar camión tolva",
  retiro_especializado: "Retiro especializado",
  fiscalizacion: "Fiscalizar",
  derivar: "Derivar a otra unidad",
  pedir_mas_datos: "Pedir más datos al vecino",
};

export const ESTILO_PRIORIDAD = {
  alta: { texto: "Alta", clases: "border-critico-borde bg-critico-fondo text-critico", hex: "#991B1B" },
  media: { texto: "Media", clases: "border-adv-borde bg-adv-fondo text-adv", hex: "#92400E" },
  baja: { texto: "Baja", clases: "border-gray-300 bg-gray-100 text-gray-700", hex: "#4B5563" },
};

export function haceCuanto(iso, ahora = Date.now()) {
  const min = Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 60000));
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} ${min === 1 ? "minuto" : "minutos"}`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} ${h === 1 ? "hora" : "horas"}`;
  const d = Math.round(h / 24);
  return `hace ${d} ${d === 1 ? "día" : "días"}`;
}

/** Espera del más antiguo, sin "hace" ("2 días"). */
export const espera = (iso) => haceCuanto(iso).replace(/^hace /, "");

export const horaCorta = (iso) =>
  new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
