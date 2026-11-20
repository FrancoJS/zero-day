// Cliente HTTP con fetch nativo. Las rutas /api llegan al backend vía proxy de Vite.

async function leerError(respuesta) {
  try {
    const cuerpo = await respuesta.json();
    if (cuerpo?.mensaje) return cuerpo.mensaje;
  } catch {
    // el cuerpo no era JSON
  }
  return `Error HTTP ${respuesta.status} del backend.`;
}

async function peticion(ruta, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(ruta, {
      ...opciones,
      headers: { "Content-Type": "application/json", ...(opciones.headers || {}) },
    });
  } catch {
    throw new Error("No se pudo conectar con el backend. ¿Está levantado?");
  }
  if (!respuesta.ok) throw new Error(await leerError(respuesta));
  return respuesta;
}

export async function obtenerSalud() {
  return (await peticion("/api/health")).json();
}

/** Últimos análisis guardados: { bd: "desactivada" | "conectada", registros: [...] }. */
export async function obtenerHistorial(limite = 10) {
  return (await peticion(`/api/historial?limite=${limite}`)).json();
}

/** Última corrida de evaluacion.evaluar: { disponible: false } o { disponible: true, aciertos, total, ... }. */
export async function obtenerEvaluacion() {
  return (await peticion("/api/evaluacion")).json();
}

export async function analizarTexto(texto) {
  const respuesta = await peticion("/api/ia/analizar", {
    method: "POST",
    body: JSON.stringify({ texto }),
  });
  return respuesta.json();
}

/**
 * Lee el SSE de /api/ia/stream. Llama alFragmento(texto) por cada trozo y
 * devuelve { latencia_ms } al terminar. Lanza Error si llega un evento 'error'.
 */
export async function streamTexto(texto, alFragmento) {
  const respuesta = await peticion("/api/ia/stream", {
    method: "POST",
    body: JSON.stringify({ texto }),
  });
  const lector = respuesta.body.getReader();
  const decodificador = new TextDecoder();
  let pendiente = "";
  while (true) {
    const { value, done } = await lector.read();
    if (done) break;
    pendiente += decodificador.decode(value, { stream: true });
    const bloques = pendiente.split("\n\n");
    pendiente = bloques.pop();
    for (const bloque of bloques) {
      const evento = bloque.match(/^event: (.*)$/m)?.[1];
      const datos = JSON.parse(bloque.match(/^data: (.*)$/m)?.[1] || "{}");
      if (evento === "fragmento") alFragmento(datos.texto);
      else if (evento === "error") throw new Error(datos.mensaje);
      else if (evento === "fin") return datos;
    }
  }
  throw new Error("El stream se cortó antes de terminar.");
}
