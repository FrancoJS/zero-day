import { useEffect, useState } from "react";
import { obtenerHistorial } from "../api";
import Aviso from "./Aviso";
import Insignia from "./Insignia";
import Tarjeta from "./Tarjeta";
import { insigniaPrioridad } from "./prioridad";

/**
 * Últimos 10 análisis guardados en la BD. `version` cambia después de cada análisis exitoso y recarga.
 * Para mostrarlo con datos fijos (galería) usar ListaHistorial.
 * @param {object} props
 * @param {number} props.version
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
 * Vista sin red del historial.
 * @param {object} props
 * @param {{bd: "desactivada"|"conectada", registros: {id, creado_en, categoria, prioridad, resumen}[]} | null} props.datos
 * @param {string} [props.error]
 */
export function ListaHistorial({ datos, error }) {
  if (error) {
    return (
      <Tarjeta titulo="Historial">
        <Aviso tono="adv" icono="alerta" titulo="Historial no disponible">
          <p className="text-base">{error}</p>
        </Aviso>
      </Tarjeta>
    );
  }
  if (!datos) return null;
  if (datos.bd === "desactivada") {
    return (
      <Tarjeta titulo="Historial">
        <p className="text-base text-texto2">Base de datos desactivada: el historial no se guarda.</p>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta titulo="Historial" subtitulo={`${datos.registros.length} recientes`}>
      {datos.registros.length === 0 ? (
        <p className="text-base text-texto2">Todavía no hay análisis guardados.</p>
      ) : (
        <ul className="flex flex-col">
          {datos.registros.map((r) => {
            const prioridad = insigniaPrioridad(r.prioridad);
            return (
              <li key={r.id} className="flex flex-col gap-1.5 border-b border-borde py-3 last:border-b-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Insignia tono={prioridad.tono} icono={prioridad.icono} className="!text-[15px]">
                    {r.prioridad}
                  </Insignia>
                  <span className="font-semibold text-texto">{r.categoria}</span>
                  <span className="ml-auto text-[14px] tabular-nums text-texto3">
                    {new Date(r.creado_en).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                <p className="text-base leading-snug text-texto2">{r.resumen}</p>
              </li>
            );
          })}
        </ul>
      )}
    </Tarjeta>
  );
}
