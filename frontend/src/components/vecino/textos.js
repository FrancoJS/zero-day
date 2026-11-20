// Textos y reglas de presentación de la vista vecino (palabras humanas, sin jerga interna).

export const TIPO_RESIDUO = {
  domiciliario: "Basura domiciliaria",
  escombros: "Escombros",
  voluminoso: "Voluminoso (muebles, colchones)",
  poda: "Restos de poda",
  peligroso: "Residuo peligroso",
  mixto: "Mixto",
  no_es_residuo: "No es un residuo",
};

export const SALUDO =
  "Hola 👋 Cuéntame qué viste y dónde. Con eso armo tu reporte para el equipo de Gestión de Calidad.";

export const RESPUESTAS_VOLUMEN = ["Cabe en una camioneta", "Se necesita un camión", "No sé"];

export const MAX_SEGUIMIENTOS = 2;

const RE_VOLUMEN = /volumen|cu[aá]nto|camioneta|cami[oó]n|tama[nñ]o|cantidad/i;

/** ¿La pregunta (o lo que falta) es sobre volumen? → se ofrecen respuestas rápidas. */
// Los botones se eligen SOLO por lo que pregunta el asistente (no por la lista de faltantes),
// para no ofrecer "Cabe en una camioneta" cuando la pregunta es sobre el tipo de basura.
const RE_TIPO = /tipo|qu[eé] (hay|es|clase)|qu[eé] (basura|residuo)|de qu[eé]/i;
export function esSobreVolumen(pregunta) {
  return RE_VOLUMEN.test(pregunta || "") && !RE_TIPO.test(pregunta || "");
}
export function esSobreTipo(pregunta) {
  return RE_TIPO.test(pregunta || "");
}
export const RESPUESTAS_TIPO = ["Escombros", "Muebles o colchones", "Ramas o poda", "Bolsas de basura", "Algo peligroso (aceite, químicos)"];

export function hora(fecha = new Date()) {
  return fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function mayuscula(texto = "") {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;
}

export function minuscula(texto = "") {
  return texto ? texto.charAt(0).toLowerCase() + texto.slice(1) : texto;
}
