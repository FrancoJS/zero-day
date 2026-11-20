import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
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
  const completo = Boolean(sector && resultado && !noEsResiduo && falta.length === 0);
  const puedeEnviar = Boolean(sector && resultado && !noEsResiduo && (completo || respondidos >= MAX_SEGUIMIENTOS));
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
    if (r.pregunta_seguimiento && (r.falta_informacion || []).length && hechas < MAX_SEGUIMIENTOS) {
      setSeguimientos(hechas + 1);
      setPreguntaPendiente(true);
      setChips(esSobreVolumen(r.pregunta_seguimiento, r.falta_informacion) ? { tipo: "volumen" } : null);
      return { pregunta: r.pregunta_seguimiento };
    }
    setPreguntaPendiente(false);
    setChips(null);
    return {
      pregunta: (r.falta_informacion || []).length
        ? "Con esto basta: puedes enviar tu reporte a la derecha."
        : "Tu reporte está listo: revísalo a la derecha y envíalo a Gestión de Calidad.",
    };
  };

  const analizar = async (lista, sid) => {
    setChips(null);
    setEscribiendo(true);
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
            "Este canal es solo para residuos y microbasurales. Otros problemas (luminarias, baches, ruidos…) van por el canal general de la Municipalidad.",
          pregunta: "Si además viste basura botada, cuéntamelo y lo agrego.",
        });
        return;
      }
      const entendi = `${lista.length === 1 ? "Gracias, ya lo estoy ordenando a la derecha. " : ""}Entendí que se trata de ${minuscula(r.resumen)}`;
      if (!sid) {
        setChips({ tipo: "sector" });
        agregar({ rol: "bot", contenido: entendi, pregunta: "¿En qué sector está?" });
        return;
      }
      agregar({ rol: "bot", contenido: entendi, ...cierre(r, seguimientos) });
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
      agregar({ rol: "bot", contenido: `Anotado: ${s.nombre}.`, ...cierre(resultado, seguimientos) });
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
      agregar({ rol: "bot", contenido: `Listo, enviamos tu reporte (folio #${String(datos.id).padStart(4, "0")}). Gracias por ayudar a tu barrio.` });
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

  return (
    <div className="container grid h-full min-h-0 grid-rows-[minmax(0,1fr)] grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 pb-6 pt-5">
      <ChatAsistente
        mensajes={mensajes}
        chips={listaChips}
        escribiendo={escribiendo}
        bloqueado={Boolean(reporte)}
        alEnviar={(t) => enviarTexto(t)}
      />
      {reporte ? (
        <ExitoReporte reporte={reporte} ejemplo={ejemplo} alReiniciar={reiniciar} />
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
          modo={modo}
          ejemplo={ejemplo}
          alEnviar={enviarFinal}
        />
      )}
    </div>
  );
}
