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

// Ejemplos reales del desafío O'Higgins Circular (triage municipal de microbasurales en Rancagua).
const EJEMPLOS = [
  "En la esquina de República de Chile con Recreo dejaron colchones viejos, bolsas de basura rotas y olor insoportable frente a la plaza.",
  "Tiraron medio camión de escombros, restos de cerámica y sacos de cemento en el bandejón central de Población Dintrans.",
  "Hay tambores con aceite quemado y baterías botadas cerca del canal en Baquedano, con riesgo para niños que juegan ahí.",
];

const PASOS = ["Entrada", "Análisis IA", "Resultado"];

function pasosHasta(indice, estado) {
  return PASOS.map((nombre, i) => ({ nombre, estado: i < indice ? "hecho" : i === indice ? estado : "pendiente" }));
}

export default function App() {
  const [texto, setTexto] = useState("");
  const [ultimaAccion, setUltimaAccion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [analisis, setAnalisis] = useState(null);
  const [textoAnalizado, setTextoAnalizado] = useState("");
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
        setVersionHistorial((v) => v + 1);
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
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 transition-colors duration-200 dark:bg-gray-950 dark:text-gray-100">
      {/* Skip link accesible (DESING.md §4) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      <Encabezado
        className="px-4 sm:px-6 lg:px-8"
        producto={
          <>
            <b>Gestión de Calidad · Microbasurales</b> · O&apos;Higgins Circular
          </>
        }
      >
        <IndicadorModo />
      </Encabezado>

      <Franja
        cargando={cargando}
        error={error}
        analisis={analisis}
        textoStream={textoStream}
        latenciaStream={latenciaStream}
        accion={ultimaAccion}
        hayTexto={Boolean(texto.trim())}
      />

      <main
        id="main-content"
        className="page-content-transition grid flex-1 grid-cols-1 items-start gap-5 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)_minmax(0,1fr)]"
      >
        <Tarjeta titulo="Reporte vecinal" subtitulo="entrada de texto" calida>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ejecutar("analizar");
            }}
            className="flex flex-col gap-3.5"
          >
            <label htmlFor="texto" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Descripción del reporte
            </label>
            <textarea
              id="texto"
              rows={6}
              maxLength={4000}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Pega aquí el reporte vecinal de microbasural o residuo…"
              className="search-input resize-y p-3.5 text-sm sm:text-base leading-relaxed"
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
                Analizar reporte
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

        <Tarjeta
          titulo="Triage y diagnóstico"
          subtitulo={analisis ? "análisis estructurado con evidencia" : textoStream ? "streaming desde Kostra" : undefined}
          calida
        >
          {cargando && !textoStream && (
            <RazonamientoEnVivo
              etiqueta={ultimaAccion === "stream" ? "Esperando el primer fragmento" : "Clasificando reporte y verificando evidencia"}
            />
          )}
          {textoStream && <RazonamientoEnVivo activo={cargando} texto={textoStream} etiqueta="Recibiendo respuesta" />}
          {error && <MensajeError mensaje={error} alReintentar={ultimaAccion ? () => ejecutar(ultimaAccion) : null} />}
          {analisis && (
            <TarjetasResultado
              key={analisis.latencia_ms + textoAnalizado}
              respuesta={analisis}
              textoAnalizado={textoAnalizado}
            />
          )}
          {!cargando && !error && !hayResultado && (
            <EstadoVacio
              mensaje="Aún no hay reporte analizado."
              detalle="Escribe un reporte de vecino o selecciona un caso de ejemplo para clasificar tipo de residuo, prioridad y recurso sugerido."
              ejemplos={EJEMPLOS}
              onEjemplo={setTexto}
            />
          )}
        </Tarjeta>

        <Historial version={versionHistorial} />
      </main>

      <div className="px-4 pb-8 sm:px-6 lg:px-8">
        <PanelCalidad />
      </div>
    </div>
  );
}

function Franja({ cargando, error, analisis, textoStream, latenciaStream, accion, hayTexto }) {
  const props = { className: "px-4 sm:px-6 lg:px-8" };
  if (cargando) {
    return (
      <FranjaEstado
        {...props}
        ocupado
        mensaje="Analizando reporte…"
        detalle={accion === "stream" ? "· la respuesta llega por streaming" : "· la IA está extrayendo prioridad y evidencia"}
        pasos={pasosHasta(1, "actual")}
      />
    );
  }
  if (error) {
    return (
      <FranjaEstado {...props} tono="error" mensaje="No se pudo completar" detalle={`· ${error}`} pasos={pasosHasta(1, "error")} />
    );
  }
  if (analisis) {
    const origen = analisis.modo === "live" ? `Kostra LIVE · ${analisis.modelo}` : "MOCK (simulado)";
    return (
      <FranjaEstado
        {...props}
        tono="ok"
        mensaje="Triage listo"
        detalle={`· en ${segundosLegibles(analisis.latencia_ms)} s · ${origen}`}
        pasos={pasosHasta(3)}
      />
    );
  }
  if (textoStream) {
    const tiempo = latenciaStream != null ? ` en ${segundosLegibles(latenciaStream)} s` : "";
    return (
      <FranjaEstado
        {...props}
        tono="ok"
        mensaje="Respuesta completa"
        detalle={`· recibida por streaming${tiempo}`}
        pasos={pasosHasta(3)}
      />
    );
  }
  return (
    <FranjaEstado
      {...props}
      mensaje="Listo para analizar"
      detalle={hayTexto ? "· presiona Analizar reporte cuando quieras" : "· escribe un reporte o elige un ejemplo"}
      pasos={pasosHasta(0, "actual")}
    />
  );
}
