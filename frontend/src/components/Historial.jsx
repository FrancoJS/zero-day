import { useEffect, useState } from "react";
import { obtenerHistorial } from "../api";
import Aviso from "./Aviso";
import Insignia from "./Insignia";
import Tarjeta from "./Tarjeta";
import { insigniaPrioridad } from "./prioridad";

/**
 * Últimos 10 análisis guardados en la BD. `version` cambia después de cada análisis exitoso y recarga.
 */
export default function Historial({ version }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerHistorial(10)
      .then((respuesta) => {
        setDatos(respuesta);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, [version]);

  return <ListaHistorial datos={datos} error={error} />;
}

/**
 * Vista sin red del historial con estética municipal (DESING.md §3, §6.2).
 */
export function ListaHistorial({ datos, error }) {
  if (error) {
    return (
      <Tarjeta titulo="Historial">
        <Aviso tono="adv" icono="alerta" titulo="Historial no disponible">
          <p className="text-sm">{error}</p>
        </Aviso>
      </Tarjeta>
    );
  }
  if (!datos) return null;
  if (datos.bd === "desactivada") {
    return (
      <Tarjeta titulo="Historial">
        <p className="text-sm text-gray-600 dark:text-gray-300">Base de datos desactivada: el historial no se guarda.</p>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta titulo="Historial" subtitulo={`${datos.registros.length} recientes`}>
      {datos.registros.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">Todavía no hay análisis guardados.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {datos.registros.map((r) => {
            const prioridad = insigniaPrioridad(r.prioridad);
            return (
              <li
                key={r.id}
                className="flex flex-col gap-1.5 rounded-xl border border-gray-200/80 bg-gray-50/70 p-3 transition-colors hover:border-rose-200 hover:bg-rose-50/25 dark:border-gray-800 dark:bg-gray-800/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Insignia tono={prioridad.tono} icono={prioridad.icono}>
                    {r.prioridad}
                  </Insignia>
                  <span className="text-xs font-bold uppercase tracking-wide text-[#8C1D28] dark:text-rose-300">
                    {r.tipo_residuo ?? r.categoria}
                  </span>
                  <span className="ml-auto text-xs tabular-nums text-gray-500 dark:text-gray-400">
                    {new Date(r.creado_en).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-snug text-gray-700 dark:text-gray-300">{r.resumen}</p>
              </li>
            );
          })}
        </ul>
      )}
    </Tarjeta>
  );
}
