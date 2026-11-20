import { useId } from "react";

/**
 * Panel blanco con título en mayúsculas (como las columnas del diseño 04).
 * @param {object} props
 * @param {string} props.titulo  título del panel (se muestra en mayúsculas)
 * @param {React.ReactNode} [props.subtitulo]  texto chico junto al título (ej. "5 relevantes · 3 ruido")
 * @param {React.ReactNode} [props.derecha]  espacio a la derecha del título (insignia, botón)
 * @param {boolean} [props.relleno=true]  padding interno del contenido; false para listas que van de borde a borde
 * @param {string} [props.className]  clases extra para el contenedor (ej. "h-full")
 * @param {React.ReactNode} props.children
 */
export default function Tarjeta({ titulo, subtitulo, derecha, relleno = true, className = "", children }) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className={`flex min-w-0 flex-col rounded-2xl border border-borde bg-superficie ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pb-2.5 pt-4">
        <h2 id={id} className="text-[15px] font-bold uppercase tracking-[0.08em] text-texto2">
          {titulo}
        </h2>
        {subtitulo && <p className="text-[15px] font-medium text-texto3">{subtitulo}</p>}
        {derecha && <div className="ml-auto">{derecha}</div>}
      </div>
      <div className={`flex min-h-0 flex-1 flex-col ${relleno ? "px-5 pb-5" : "px-3 pb-3"}`}>{children}</div>
    </section>
  );
}
