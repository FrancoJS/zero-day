import { useState } from "react";
import { analizarTexto, streamTexto } from "./api";
import Boton from "./components/Boton";
import Encabezado from "./components/Encabezado";
import EstadoVacio from "./components/EstadoVacio";
import FranjaEstado from "./components/FranjaEstado";
import Historial from "./components/Historial";
import IndicadorModo from "./components/IndicadorModo";
import MensajeError from "./components/MensajeError";
import PanelCalidad from "./components/PanelCalidad";
import RazonamientoEnVivo from "./components/RazonamientoEnVivo";
import Tarjeta from "./components/Tarjeta";
import TarjetasResultado from "./components/TarjetasResultado";
import { segundosLegibles } from "./components/useTiempoTranscurrido";

// Ejemplos del estado vacío. Mañana: reemplazar por casos reales del desafío.
const EJEMPLOS = [
  "El sistema de pagos está caído desde las 9:00 y no podemos cobrar a nadie, es urgente.",
  "Hola, ¿cuál es el horario de atención de la sucursal de Rancagua?",
  "Quiero dejar un reclamo: me cobraron dos veces el mismo mes y nadie me responde.",
];

const PASOS = ["Entrada", "Análisis IA", "Resultado"];

// Pasos de la franja: hasta `indice` hechos, el `indice` con `estado`, el resto pendientes.
function pasosHasta(indice, estado) {
  return PASOS.map((nombre, i) => ({ nombre, estado: i < indice ? "hecho" : i === indice ? estado : "pendiente" }));
}

export default function App() {
  const [texto, setTexto] = useState("");
  const [ultimaAccion, setUltimaAccion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [analisis, setAnalisis] = useState(null);
  const [textoAnalizado, setTextoAnalizado] = useState(""); // el textarea puede cambiar después
  const [textoStream, setTextoStream] = useState("");
  const [latenciaStream, setLatenciaStream] = useState(null);
  const [versionHistorial, setVersionHistorial] = useState(0);

  async function ejecutar(accion) {
    if (!texto.trim() || cargando) return;
    setUltimaAccion(accion);
    setCargando(true);
    setError("");
    setAnalisis(null);
    setTextoStream("");
    setLatenciaStream(null);
    try {
      if (accion === "analizar") {
        const enviado = texto;
        const respuesta = await analizarTexto(enviado);
        setTextoAnalizado(enviado);
        setAnalisis(respuesta);
        setVersionHistorial((v) => v + 1); // recarga el historial
      } else {
        const fin = await streamTexto(texto, (fragmento) => setTextoStream((previo) => previo + fragmento));
        setLatenciaStream(fin?.latencia_ms ?? null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  const hayResultado = Boolean(analisis || textoStream);
  const motivoBloqueo = cargando ? "Espera a que termine el análisis" : "Escribe un texto primero";

  return (
    <div className="flex min-h-screen flex-col">
      <Encabezado className="px-6 lg:px-8" producto={<><b className="text-texto">Base del equipo</b> · Hackatón Huawei INACAP 2026</>}>
        <IndicadorModo />
      </Encabezado>
      <Franja cargando={cargando} error={error} analisis={analisis} textoStream={textoStream} latenciaStream={latenciaStream} accion={ultimaAccion} hayTexto={Boolean(texto.trim())} />

      <main className="grid grid-cols-1 items-start gap-5 px-6 py-5 lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]">
        <Tarjeta titulo="Entrada">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ejecutar("analizar");
            }}
            className="flex flex-col gap-3"
          >
            <label htmlFor="texto" className="text-[17px] font-semibold text-texto">
              Texto a analizar
            </label>
            <textarea
              id="texto"
              rows={6}
              maxLength={4000}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Pega aquí el mensaje, reclamo o reporte…"
              className="w-full resize-y rounded-xl border-[1.5px] border-borde bg-superficie p-3.5 text-[18px] leading-relaxed text-texto placeholder:text-texto3 focus:border-acento"
            />
            <div className="grid gap-2.5">
              <Boton
                ancho
                type="submit"
                variante="primario"
                tamano="grande"
                icono="chispa"
                disabled={cargando || !texto.trim()}
                motivoDeshabilitado={motivoBloqueo}
              >
                Analizar
              </Boton>
              <Boton
                ancho
                onClick={() => ejecutar("stream")}
                disabled={cargando || !texto.trim()}
                motivoDeshabilitado={motivoBloqueo}
              >
                Respuesta larga (streaming)
              </Boton>
            </div>
          </form>
        </Tarjeta>

        <Tarjeta titulo="Resultado" subtitulo={analisis ? "análisis estructurado" : textoStream ? "streaming desde Kostra" : undefined}>
          {cargando && !textoStream && (
            <RazonamientoEnVivo etiqueta={ultimaAccion === "stream" ? "Esperando el primer fragmento" : "Esperando la respuesta de la IA"} />
          )}
          {textoStream && <RazonamientoEnVivo activo={cargando} texto={textoStream} etiqueta="Recibiendo respuesta" />}
          {error && <MensajeError mensaje={error} alReintentar={ultimaAccion ? () => ejecutar(ultimaAccion) : null} />}
          {analisis && <TarjetasResultado key={analisis.latencia_ms + textoAnalizado} respuesta={analisis} textoAnalizado={textoAnalizado} />}
          {!cargando && !error && !hayResultado && (
            <EstadoVacio
              mensaje="Aún no hay resultado."
              detalle="Escribe un texto o elige un ejemplo y presiona Analizar."
              ejemplos={EJEMPLOS}
              onEjemplo={setTexto}
            />
          )}
        </Tarjeta>

        <Historial version={versionHistorial} />
      </main>

      <div className="px-6 pb-6 lg:px-8">
        <PanelCalidad />
      </div>
    </div>
  );
}

// Qué dice la franja según el estado del flujo.
function Franja({ cargando, error, analisis, textoStream, latenciaStream, accion, hayTexto }) {
  const props = { className: "px-6 lg:px-8" };
  if (cargando) {
    return (
      <FranjaEstado
        {...props}
        ocupado
        mensaje="Analizando…"
        detalle={accion === "stream" ? "· la respuesta llega por streaming" : "· la IA está procesando tu texto"}
        pasos={pasosHasta(1, "actual")}
      />
    );
  }
  if (error) {
    return <FranjaEstado {...props} tono="error" mensaje="No se pudo completar" detalle={`· ${error}`} pasos={pasosHasta(1, "error")} />;
  }
  if (analisis) {
    const origen = analisis.modo === "live" ? `Kostra LIVE · ${analisis.modelo}` : "MOCK (simulado)";
    return (
      <FranjaEstado
        {...props}
        tono="ok"
        mensaje="Resultado listo"
        detalle={`· en ${segundosLegibles(analisis.latencia_ms)} s · ${origen}`}
        pasos={pasosHasta(3)}
      />
    );
  }
  if (textoStream) {
    const tiempo = latenciaStream != null ? ` en ${segundosLegibles(latenciaStream)} s` : "";
    return <FranjaEstado {...props} tono="ok" mensaje="Respuesta completa" detalle={`· recibida por streaming${tiempo}`} pasos={pasosHasta(3)} />;
  }
  return (
    <FranjaEstado
      {...props}
      mensaje="Listo para analizar"
      detalle={hayTexto ? "· presiona Analizar cuando quieras" : "· escribe un texto o elige un ejemplo"}
      pasos={pasosHasta(0, "actual")}
    />
  );
}
