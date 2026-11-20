import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Info } from "lucide-react";
import { analizarBorrador, cargarSectores, enviarReporte } from "../fuente";
import ChatAsistente from "../components/vecino/ChatAsistente";
import PanelReporte, { filasDelReporte } from "../components/vecino/PanelReporte";
import ExitoReporte from "../components/vecino/ExitoReporte";
import { MAX_SEGUIMIENTOS, RESPUESTAS_VOLUMEN, SALUDO, esSobreVolumen, hora, minuscula } from "../components/vecino/textos";

// Vista vecino (diseño 04): chat con el asistente + panel "Tu reporte" que se llena en vivo.
// Datos solo vía fuente.js (API real o, si el backend aún no tiene el endpoint, datos de ejemplo marcados).
// ?demo=1 (solo desarrollo) precarga un primer mensaje para revisar el estado lleno.

const DEMO = import.meta.env.DEV && new URLSearchParams(window.location.search).get("demo") === "1";
const TEXTO_DEMO =
  "Botaron escombros y un colchón en la esquina del pasaje Los Aromos con Av. España, justo al lado del colegio. Los niños tienen que bajarse a la calle para pasar.";
const PASO_MS = 250;

const saludo = () => ({ id: 0, rol: "bot", contenido: SALUDO });

// Reconoce el sector si el vecino lo escribe ("es en Rancagua Sur"): nombres más largos primero
// (Suroriente antes que Oriente), sin tildes ni mayúsculas y con límites de palabra.
const normalizar = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function detectarSector(texto, sectores) {
  const limpio = ` ${normalizar(texto)} `;
  const candidatos = [...sectores].sort((a, b) => b.nombre.length - a.nombre.length);
  return candidatos.find((s) => new RegExp(`[^a-z]${normalizar(s.nombre)}[^a-z]`).test(limpio))?.id ?? null;
}

export default function VistaVecino() {
  const reducir = useReducedMotion();
  const idRef = useRef(1);
  const timers = useRef([]);
  const demoHecho = useRef(false);

  const [sectores, setSectores] = useState([]);
  const [ejemplo, setEjemplo] = useState(false);
  const [mensajes, setMensajes] = useState([saludo()]);
  const [chips, setChips] = useState(null); // {tipo: "sector"|"volumen"|"reintentar", accion?}
  const [escribiendo, setEscribiendo] = useState(false);
  const [textos, setTextos] = useState([]);
  const [sectorId, setSectorId] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [modo, setModo] = useState(null);
  const [seguimientos, setSeguimientos] = useState(0); // preguntas de seguimiento hechas
  const [respondidos, setRespondidos] = useState(0); // preguntas de seguimiento respondidas
  const [preguntaPendiente, setPreguntaPendiente] = useState(false);
  const [visibles, setVisibles] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [reporte, setReporte] = useState(null);

  const sector = sectores.find((s) => s.id === sectorId) || null;
  const filas = filasDelReporte(sector, resultado);
  const noEsResiduo = resultado?.tipo_residuo === "no_es_residuo";
  const falta = resultado?.falta_informacion || [];
  const listos = resultado
    ? [sector, resultado.tipo_residuo, resultado.prioridad, resultado.ubicacion].filter(Boolean).length + (falta.length === 0 ? 1 : 0)
    : sector ? 1 : 0;
  const total = 5;
  const faltaObligatorio = falta.filter((f) => !/volumen/i.test(f));
  // Obligatorios: sector, tipo de residuo y ubicación. El volumen es opcional y no bloquea el envío.
  const completo = Boolean(sector && resultado && !noEsResiduo && resultado.ubicacion && faltaObligatorio.length === 0);
  const puedeEnviar = completo;
  const texto = textos.join("\n");

  const agregar = (...nuevos) =>
    setMensajes((m) => [...m, ...nuevos.map((n) => ({ id: idRef.current++, hora: hora(), ...n }))]);

  const marcarEjemplo = (e) => e && setEjemplo(true);

  const revelar = (n, desde) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (reducir) return setVisibles(n);
    setVisibles(desde);
    for (let i = desde + 1; i <= n; i++) timers.current.push(setTimeout(() => setVisibles(i), PASO_MS * (i - desde)));
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const traerSectores = async () => {
    try {
      const { datos, ejemplo: e } = await cargarSectores();
      marcarEjemplo(e);
      setSectores(datos.sectores);
      return datos.sectores;
    } catch (err) {
      agregar({ rol: "error", contenido: `No pude cargar la lista de sectores. ${err.message}` });
      setChips({ tipo: "reintentar", accion: "sectores" });
      return null;
    }
  };

  useEffect(() => {
    traerSectores().then((lista) => {
      if (DEMO && lista && !demoHecho.current) {
        demoHecho.current = true;
        setSectorId("sur");
        enviarTexto(TEXTO_DEMO, "sur");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Pregunta de seguimiento (máx. 2) o cierre, según el resultado y los contadores actuales. */
  const cierre = (r, hechas) => {
    if (r.pregunta_seguimiento && (r.falta_informacion || []).length) {
      setSeguimientos(hechas + 1);
      setPreguntaPendiente(true);
      setChips(esSobreVolumen(r.pregunta_seguimiento, r.falta_informacion) ? { tipo: "volumen" } : null);
      return { pregunta: r.pregunta_seguimiento };
    }
    setPreguntaPendiente(false);
    setChips(null);
    return {
      pregunta: r.ubicacion ? null : "¿Me indicas la calle, la esquina o una referencia del lugar?",
    };
  };

  const analizar = async (lista, sidElegido) => {
    setChips(null);
    setEscribiendo(true);
    const sid = sidElegido || detectarSector(lista.join(" "), sectores);
    if (sid && !sidElegido) setSectorId(sid);
    try {
      const { datos, ejemplo: e } = await analizarBorrador(lista.join("\n"), sid, lista.length - 1);
      marcarEjemplo(e);
      const r = datos.analisis.resultado;
      setResultado(r);
      setModo(datos.analisis.modo);
      const sectorObj = sectores.find((s) => s.id === sid) || (sid ? { id: sid, nombre: sid } : null);
      revelar(filasDelReporte(sectorObj, r).length, lista.length > 1 ? 1 : 0);

      if (r.tipo_residuo === "no_es_residuo") {
        setPreguntaPendiente(false);
        setChips(null);
        agregar({
          rol: "bot",
          contenido:
            r.respuesta_vecino ||
            "Este canal es solo para basura y microbasurales. Otros problemas (luminarias, baches, ruidos…) van por el canal general de la Municipalidad.",
          pregunta: "Si además viste basura botada, cuéntamelo y lo agrego.",
        });
        return;
      }
      const voz = (r.respuesta_vecino || r.resumen || "").trim();
      const entendi = r.pregunta_seguimiento ? voz.replace(r.pregunta_seguimiento, "").trim() || voz : voz;
      // Una sola pregunta por mensaje: si la IA ya preguntó dentro de su frase, no se repite en negrita.
      const sinPreguntas = entendi.replace(/¿[^?]*\?/g, "").trim() || entendi;
      if (!sid) {
        setChips({ tipo: "sector" });
        agregar({ rol: "bot", contenido: sinPreguntas, pregunta: "¿En qué sector de Rancagua está?" });
        return;
      }
      const siguiente = cierre(r, seguimientos);
      agregar({ rol: "bot", contenido: siguiente.pregunta ? sinPreguntas : entendi, ...siguiente });
    } catch (err) {
      agregar({ rol: "error", contenido: err.message || "Error desconocido." });
      setChips({ tipo: "reintentar", accion: "analizar" });
    } finally {
      setEscribiendo(false);
    }
  };

  const enviarTexto = (t, sid = sectorId) => {
    if (preguntaPendiente) setRespondidos((n) => n + 1);
    setPreguntaPendiente(false);
    const lista = [...textos, t];
    setTextos(lista);
    agregar({ rol: "yo", contenido: t });
    analizar(lista, sid);
  };

  const elegirSector = (s) => {
    setSectorId(s.id);
    agregar({ rol: "yo", contenido: s.nombre });
    if (resultado) {
      setVisibles((v) => Math.max(v, filasDelReporte(s, resultado).length));
      agregar({ rol: "bot", contenido: `Perfecto, quedó en ${s.nombre}.`, ...cierre(resultado, seguimientos) });
    } else setChips(null);
  };

  const enviarFinal = async () => {
    setChips(null);
    setEnviando(true);
    setEscribiendo(true);
    try {
      const { datos, ejemplo: e } = await enviarReporte(texto, sectorId);
      marcarEjemplo(e);
      setReporte(datos);
      agregar({ rol: "bot", contenido: `Listo, tu reporte quedó registrado con el folio #${String(datos.id).padStart(4, "0")}. El equipo de Gestión de Calidad lo revisará. ¡Gracias por cuidar tu barrio!` });
    } catch (err) {
      agregar({ rol: "error", contenido: `No se pudo enviar el reporte: ${err.message || "error desconocido."}` });
      setChips({ tipo: "reintentar", accion: "enviar" });
    } finally {
      setEnviando(false);
      setEscribiendo(false);
    }
  };

  const reiniciar = () => {
    timers.current.forEach(clearTimeout);
    setMensajes([saludo()]);
    setChips(null);
    setTextos([]);
    setSectorId(null);
    setResultado(null);
    setModo(null);
    setSeguimientos(0);
    setRespondidos(0);
    setPreguntaPendiente(false);
    setVisibles(0);
    setReporte(null);
  };

  const reintentar = () => {
    if (chips?.accion === "enviar") return enviarFinal();
    if (chips?.accion === "sectores") {
      setChips(null);
      return traerSectores();
    }
    return analizar(textos, sectorId);
  };

  let listaChips = [];
  if (chips?.tipo === "sector") listaChips = sectores.map((s) => ({ texto: s.nombre, alElegir: () => elegirSector(s) }));
  else if (chips?.tipo === "volumen") listaChips = RESPUESTAS_VOLUMEN.map((t) => ({ texto: t, alElegir: () => enviarTexto(t) }));
  else if (chips?.tipo === "reintentar") listaChips = [{ texto: "Reintentar", reintentar: true, alElegir: reintentar }];

  const nota = ejemplo
    ? "Datos de ejemplo: el backend de reportes aún no está conectado"
    : reporte?.simulado
      ? "Reportes de ejemplo simulados para la demo · despacho simulado"
      : null;

  return (
    <div className="container flex h-full min-h-0 flex-col gap-3 pb-4 pt-5">
    <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6">
      <ChatAsistente
        mensajes={mensajes}
        chips={listaChips}
        escribiendo={escribiendo}
        bloqueado={Boolean(reporte)}
        alEnviar={(t) => enviarTexto(t)}
      />
      {reporte ? (
        <ExitoReporte reporte={reporte} alReiniciar={reiniciar} />
      ) : (
        <PanelReporte
          filas={filas}
          esperados={resultado ? filas.length : 5}
          visibles={resultado ? visibles : 0}
          listos={listos}
          total={total}
          completo={completo}
          puedeEnviar={puedeEnviar}
          faltan={Math.max(1, total - listos)}
          noEsResiduo={noEsResiduo}
          enviando={enviando}
          alEnviar={enviarFinal}
        />
      )}
    </div>
      {nota && (
        <p className="flex shrink-0 items-center gap-2 text-sm text-gray-500">
          <Info aria-hidden="true" className="h-4 w-4" />
          {nota}
        </p>
      )}
    </div>
  );
}
