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
export function esSobreVolumen(pregunta, falta = []) {
  return RE_VOLUMEN.test(pregunta || "") || falta.some((f) => RE_VOLUMEN.test(f));
}

export function hora(fecha = new Date()) {
  return fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function mayuscula(texto = "") {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;
}

export function minuscula(texto = "") {
  return texto ? texto.charAt(0).toLowerCase() + texto.slice(1) : texto;
}
