import { useEffect, useState } from "react";
import { obtenerEvaluacion } from "../api";
import Icono from "./Iconos";
import { montoClp } from "./TarjetasResultado";

const COMANDO = "docker compose exec -e AI_MODE=live backend python -m evaluacion.evaluar";

const TIPOS = {
  normal: { nombre: "Casos normales", prueba: "mensajes típicos del día a día" },
  ambiguo: { nombre: "Mensajes ambiguos", prueba: "que no invente urgencia ni categoría" },
  inyeccion: { nombre: "Intento de manipulación", prueba: "que ignore órdenes escondidas en el texto" },
  fuera_de_dominio: { nombre: "Fuera del tema", prueba: "que no trate preguntas ajenas como casos reales" },
  datos_sensibles: { nombre: "Datos sensibles", prueba: "que no repita RUT, correos ni teléfonos" },
  informal: { nombre: "Lenguaje informal", prueba: "que entienda modismos y errores de escritura" },
};

const numero = (valor, opciones) => valor.toLocaleString("es-CL", opciones);

function fechaCorta(iso) {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "fecha desconocida";
  const dos = (n) => String(n).padStart(2, "0");
  return `${dos(fecha.getDate())}/${dos(fecha.getMonth() + 1)} ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

function motivoLegible(motivo) {
  return motivo
    .replace(/^categoria/, "categoría")
    .replace(/esperaba '([^']*)', obtuvo '([^']*)'/, "se esperaba «$1» y la IA respondió «$2»")
    .replace(/contiene dato prohibido '([^']*)'/, "repitió un dato sensible");
}

function consumoPorAnalisis(datos) {
  const casos = datos.total || 0;
  if (!casos) return null;
  if (datos.costo_clp_estimado != null) {
    return {
      titulo: "Costo",
      valor: `≈ $${montoClp(datos.costo_clp_estimado / casos)}`,
      desc: "CLP por análisis (estimado con tokens reales)",
    };
  }
  if (datos.costo_usd_estimado != null) {
    const usd = datos.costo_usd_estimado / casos;
    return {
      titulo: "Costo",
      valor: `≈ US$${numero(usd, { maximumSignificantDigits: 2 })}`,
      desc: "por análisis (estimado con tokens reales)",
    };
  }
  if (datos.tokens_entrada != null && datos.tokens_salida != null) {
    const tokens = Math.round((datos.tokens_entrada + datos.tokens_salida) / casos);
    return {
      titulo: "Consumo",
      valor: `≈ ${numero(tokens)}`,
      desc: "tokens por análisis (sin precios configurados, sin costo)",
    };
  }
  return null;
}

/**
 * Panel de calidad de la última corrida LIVE, con tarjetas QuickStats en sub-paleta Borgoña/Vino (DESING.md §2.2, §5.2).
 */
export default function PanelCalidad() {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    obtenerEvaluacion()
      .then(setDatos)
      .catch(() => setDatos(null));
  }, []);

  return <VistaCalidad datos={datos} />;
}

export function VistaCalidad({ datos }) {
  if (!datos) return null;
  if (!datos.disponible) {
    return (
      <p className="rounded-xl border border-rose-200/80 bg-rose-50/25 px-4 py-3 text-xs sm:text-sm text-gray-600 dark:border-rose-900/40 dark:bg-gray-900 dark:text-gray-300">
        Aún no hay evaluación con la IA real. Para generarla:{" "}
        <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-[#8C1D28] border border-rose-200 dark:bg-gray-800 dark:text-rose-200">
          {COMANDO}
        </code>
      </p>
    );
  }

  const segundos = numero((datos.latencia_promedio_ms || 0) / 1000, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const casos = datos.casos || [];
  const consumo = consumoPorAnalisis(datos);

  return (
    <section
      aria-labelledby="titulo-calidad"
      className={`grid grid-cols-1 overflow-hidden rounded-xl border border-rose-200/80 bg-white shadow-sm md:grid-cols-2 dark:border-rose-900/50 dark:bg-gray-900 ${
        consumo ? "xl:grid-cols-[260px_190px_230px_minmax(0,1fr)]" : "xl:grid-cols-[260px_190px_minmax(0,1fr)]"
      }`}
    >
      <Kpi titulo="Calidad del agente" id="titulo-calidad" destacado>
        <p className="text-5xl font-extrabold leading-none tracking-tight text-gray-900 tabular-nums dark:text-white">
          {datos.aciertos}
          <small className="text-2xl font-bold text-gray-400">/{datos.total}</small>
        </p>
        <p className="mt-1.5 text-xs sm:text-sm leading-snug text-gray-600 dark:text-gray-300">
          casos correctos con la IA real
        </p>
        <p className="mt-1.5 text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
          ● Observado · {datos.modelo} · {fechaCorta(datos.fecha)}
        </p>
      </Kpi>
      <Kpi titulo="Tiempo">
        <p className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 tabular-nums dark:text-white">
          {segundos} <small className="text-lg font-bold text-gray-500">s</small>
        </p>
        <p className="mt-1.5 text-xs sm:text-sm leading-snug text-gray-600 dark:text-gray-300">promedio por análisis</p>
      </Kpi>
      {consumo && (
        <Kpi titulo={consumo.titulo}>
          <p className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 tabular-nums dark:text-white">
            {consumo.valor}
          </p>
          <p className="mt-1.5 text-xs sm:text-sm leading-snug text-gray-600 dark:text-gray-300">{consumo.desc}</p>
        </Kpi>
      )}
      <div className="px-5 py-4 md:col-span-2 xl:col-span-1">
        <p className="mb-2.5 text-xs text-gray-500 dark:text-gray-400">
          Set fijo de casos con respuesta conocida: comparamos lo que responde la IA con lo esperado.
        </p>
        <ul aria-label="Resultado por tipo de caso" className="grid grid-cols-1 items-start gap-x-6 gap-y-2.5 lg:grid-cols-2">
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

function Kpi({ titulo, id, destacado = false, children }) {
  return (
    <div
      className={`flex flex-col justify-center border-b border-rose-100 px-5 py-4 md:border-r xl:border-b-0 dark:border-gray-800 ${
        destacado ? "bg-rose-50/35 dark:bg-rose-950/20" : "bg-rose-50/15 dark:bg-gray-800/30"
      }`}
    >
      <p id={id} className="mb-1.5 text-2xs font-bold uppercase tracking-wider text-[#8C1D28] dark:text-rose-300">
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
    <li
      className={`grid grid-cols-[20px_minmax(0,1fr)_48px] items-center gap-x-2 ${
        ok ? "text-gray-900 dark:text-gray-100" : "text-red-800 dark:text-red-300"
      }`}
    >
      <Icono
        nombre={ok ? "check" : "cruz"}
        className={`h-4.5 w-4.5 ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
        grosor={2.8}
      />
      <span className="min-w-0">
        <span className="block text-xs sm:text-sm font-semibold leading-tight" title={info.prueba}>
          {info.nombre}
          <span className="sr-only">{ok ? " (todo correcto)" : " (con fallas)"}</span>
        </span>
        {info.prueba && <span className="block text-xs leading-tight text-gray-500 dark:text-gray-400">{info.prueba}</span>}
        <span
          className={`mt-1 block h-1.5 overflow-hidden rounded-full ${
            ok ? "bg-gray-100 dark:bg-gray-800" : "bg-red-100 dark:bg-red-950"
          }`}
        >
          <span
            className={`block h-full ${ok ? "bg-emerald-600" : "bg-red-600"}`}
            style={{ width: `${porcentaje}%` }}
          />
        </span>
      </span>
      <span className="text-right text-sm font-bold tabular-nums">
        {cuenta.aciertos}/{cuenta.total}
      </span>
      {!ok && (
        <span className="col-span-3 mt-1 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs leading-snug text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <Icono nombre="error" className="mt-0.5 h-3.5 w-3.5" grosor={2.4} />
          <span>Falló: {motivos.map(motivoLegible).join("; ") || "sin detalle"}</span>
        </span>
      )}
    </li>
  );
}
