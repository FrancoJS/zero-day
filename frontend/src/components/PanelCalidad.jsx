import { useEffect, useState } from "react";
import { obtenerEvaluacion } from "../api";
import Icono from "./Iconos";
import { montoClp } from "./TarjetasResultado";

// Solo las corridas con Kostra real alimentan este panel (MOCK no mide calidad).
const COMANDO = "docker compose exec -e AI_MODE=live backend python -m evaluacion.evaluar";

// Nombre y explicación de cada tipo de caso, en lenguaje para el jurado.
const TIPOS = {
  normal: { nombre: "Casos normales", prueba: "mensajes típicos del día a día" },
  ambiguo: { nombre: "Mensajes ambiguos", prueba: "que no invente urgencia ni categoría" },
  inyeccion: { nombre: "Intento de manipulación", prueba: "que ignore órdenes escondidas en el texto" },
  fuera_de_dominio: { nombre: "Fuera del tema", prueba: "que no trate preguntas ajenas como casos reales" },
  datos_sensibles: { nombre: "Datos sensibles", prueba: "que no repita RUT, correos ni teléfonos" },
  informal: { nombre: "Lenguaje informal", prueba: "que entienda modismos y errores de escritura" },
};

const numero = (valor, opciones) => valor.toLocaleString("es-CL", opciones);

// "20/11 13:50" en la hora local del navegador
function fechaCorta(iso) {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "fecha desconocida";
  const dos = (n) => String(n).padStart(2, "0");
  return `${dos(fecha.getDate())}/${dos(fecha.getMonth() + 1)} ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

// "categoria: esperaba 'otro', obtuvo 'consulta'" -> "categoría: se esperaba «otro» y la IA respondió «consulta»"
function motivoLegible(motivo) {
  return motivo
    .replace(/^categoria/, "categoría")
    .replace(/esperaba '([^']*)', obtuvo '([^']*)'/, "se esperaba «$1» y la IA respondió «$2»")
    .replace(/contiene dato prohibido '([^']*)'/, "repitió un dato sensible");
}

// Costo o, si no hay precios configurados, tokens promedio por análisis. null si no hay nada que mostrar.
function consumoPorAnalisis(datos) {
  const casos = datos.total || 0;
  if (!casos) return null;
  if (datos.costo_clp_estimado != null) {
    return { titulo: "Costo", valor: `≈ $${montoClp(datos.costo_clp_estimado / casos)}`, desc: "CLP por análisis (estimado con tokens reales)" };
  }
  if (datos.costo_usd_estimado != null) {
    const usd = datos.costo_usd_estimado / casos;
    return { titulo: "Costo", valor: `≈ US$${numero(usd, { maximumSignificantDigits: 2 })}`, desc: "por análisis (estimado con tokens reales)" };
  }
  if (datos.tokens_entrada != null && datos.tokens_salida != null) {
    const tokens = Math.round((datos.tokens_entrada + datos.tokens_salida) / casos);
    return { titulo: "Consumo", valor: `≈ ${numero(tokens)}`, desc: "tokens por análisis (sin precios configurados, sin costo)" };
  }
  return null;
}

/**
 * Resultado de la última corrida LIVE de la evaluación, estilo auditorio (franja inferior del diseño 04):
 * X/N gigante, tiempo, costo y resultado por tipo de caso con el motivo de cada falla.
 * Consulta /api/evaluacion. Para mostrarlo con datos fijos (galería) usar VistaCalidad.
 */
export default function PanelCalidad() {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    obtenerEvaluacion()
      .then(setDatos)
      .catch(() => setDatos(null)); // sin backend ya avisa IndicadorModo
  }, []);

  return <VistaCalidad datos={datos} />;
}

/**
 * Vista sin red del panel de calidad.
 * @param {object} props
 * @param {object|null} props.datos  respuesta de /api/evaluacion ({disponible, aciertos, total, latencia_promedio_ms, por_tipo, casos, …})
 */
export function VistaCalidad({ datos }) {
  if (!datos) return null;
  if (!datos.disponible) {
    // Estado solo para el equipo: en la demo siempre debe haber una corrida live.
    return (
      <p className="text-[15px] text-texto2">
        Aún no hay evaluación con la IA real. Para generarla:{" "}
        <code className="rounded bg-sutil px-1.5 py-0.5 text-[14px] text-texto">{COMANDO}</code>
      </p>
    );
  }

  const segundos = numero((datos.latencia_promedio_ms || 0) / 1000, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const casos = datos.casos || [];
  const consumo = consumoPorAnalisis(datos);

  return (
    <section
      aria-labelledby="titulo-calidad"
      className={`grid grid-cols-1 rounded-2xl border border-borde bg-superficie md:grid-cols-2 ${
        consumo ? "xl:grid-cols-[300px_210px_250px_minmax(0,1fr)]" : "xl:grid-cols-[300px_210px_minmax(0,1fr)]"
      }`}
    >
      <Kpi titulo="Calidad del agente" id="titulo-calidad">
        <p className="text-[76px] font-extrabold leading-none tracking-tighter text-texto tabular-nums">
          {datos.aciertos}
          <small className="text-[40px] font-bold text-texto3">/{datos.total}</small>
        </p>
        <p className="mt-2 text-[17px] leading-snug text-texto2">casos correctos con la IA real</p>
        <p className="mt-1.5 text-[14px] font-bold text-ok">
          ● Observado · {datos.modelo} · {fechaCorta(datos.fecha)}
        </p>
      </Kpi>
      <Kpi titulo="Tiempo">
        <p className="text-[46px] font-extrabold leading-tight tracking-tight text-texto tabular-nums">
          {segundos} <small className="text-[24px] font-bold text-texto2">s</small>
        </p>
        <p className="mt-2 text-[17px] leading-snug text-texto2">promedio por análisis</p>
      </Kpi>
      {consumo && (
        <Kpi titulo={consumo.titulo}>
          <p className="text-[46px] font-extrabold leading-tight tracking-tight text-texto tabular-nums">{consumo.valor}</p>
          <p className="mt-2 text-[17px] leading-snug text-texto2">{consumo.desc}</p>
        </Kpi>
      )}
      <div className="px-6 py-4 md:col-span-2 xl:col-span-1">
        <p className="mb-2 text-[14px] text-texto2">
          Set fijo de casos con respuesta conocida: comparamos lo que responde la IA con lo esperado.
        </p>
        <ul aria-label="Resultado por tipo de caso" className="grid grid-cols-1 items-start gap-x-7 gap-y-3 lg:grid-cols-2">
          {Object.entries(datos.por_tipo || {}).map(([tipo, cuenta]) => {
            const info = TIPOS[tipo] || { nombre: tipo, prueba: "" };
            const fallidos = casos.filter((caso) => caso.tipo === tipo && !caso.ok);
            return (
              <FilaTipo key={tipo} info={info} cuenta={cuenta} motivos={fallidos.flatMap((caso) => caso.motivos || [])} />
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Kpi({ titulo, id, children }) {
  return (
    <div className="flex flex-col justify-center border-b border-borde px-6 py-4 md:border-r xl:border-b-0">
      <p id={id} className="mb-2 text-[14px] font-bold uppercase tracking-[0.08em] text-texto2">
        {titulo}
      </p>
      {children}
    </div>
  );
}

function FilaTipo({ info, cuenta, motivos }) {
  const ok = cuenta.aciertos === cuenta.total;
  const porcentaje = cuenta.total ? (cuenta.aciertos / cuenta.total) * 100 : 0;
  return (
    <li className={`grid grid-cols-[24px_minmax(0,1fr)_56px] items-center gap-x-2.5 ${ok ? "text-texto" : "text-critico"}`}>
      <Icono nombre={ok ? "check" : "cruz"} className={`h-[22px] w-[22px] ${ok ? "text-ok" : "text-critico"}`} grosor={3} />
      <span className="min-w-0">
        <span className="block text-[17px] font-semibold leading-tight" title={info.prueba}>
          {info.nombre}
          <span className="sr-only">{ok ? " (todo correcto)" : " (con fallas)"}</span>
        </span>
        {info.prueba && <span className="block text-[14px] leading-tight text-texto3">{info.prueba}</span>}
        <span className={`mt-1 block h-2 overflow-hidden rounded ${ok ? "bg-sutil" : "bg-critico-fondo"}`}>
          <span className={`block h-full ${ok ? "bg-ok" : "bg-critico"}`} style={{ width: `${porcentaje}%` }} />
        </span>
      </span>
      <span className="text-right text-[19px] font-extrabold tabular-nums">
        {cuenta.aciertos}/{cuenta.total}
      </span>
      {!ok && (
        <span className="col-span-3 mt-1.5 flex items-start gap-1.5 rounded-lg bg-critico-fondo px-2.5 py-1.5 text-[14px] leading-snug text-critico">
          <Icono nombre="error" className="mt-px h-4 w-4" grosor={2.6} />
          <span>Falló: {motivos.map(motivoLegible).join("; ") || "sin detalle"}</span>
        </span>
      )}
    </li>
  );
}
