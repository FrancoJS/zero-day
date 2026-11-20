import { useId } from "react";

/**
 * Tarjeta institucional (DESING.md §3.2, §5.2, §6.2):
 * Superficie blanca con borde cálido/neutro, sombra suave y cabecera con sobretítulo (eyebrow)
 * en Borgoña/Vino (`#8C1D28` / `dark:text-rose-300`).
 * @param {object} props
 * @param {string} props.titulo  título del panel
 * @param {React.ReactNode} [props.subtitulo]  texto secundario junto al título
 * @param {React.ReactNode} [props.derecha]  espacio a la derecha del título (insignia, botón)
 * @param {boolean} [props.relleno=true]  padding interno del contenido
 * @param {boolean} [props.calida=false]  usa borde cálido rose-200/80 estilo Hero/Accesos Directos (DESING.md §5.2)
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export default function Tarjeta({ titulo, subtitulo, derecha, relleno = true, calida = false, className = "", children }) {
  const id = useId();
  const bordeClases = calida
    ? "border-rose-200/80 dark:border-rose-900/50 shadow-md shadow-gray-200/70 dark:shadow-black/40"
    : "border-gray-200 dark:border-gray-800 shadow-sm hover:border-gray-300 dark:hover:border-gray-700";

  return (
    <section
      aria-labelledby={id}
      className={`flex min-w-0 flex-col rounded-xl border bg-white dark:bg-gray-900 transition-colors ${bordeClases} ${className}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-gray-100 px-5 py-3.5 dark:border-gray-800">
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden="true" className="h-3.5 w-1 shrink-0 rounded-full bg-[#8C1D28] dark:bg-rose-400" />
          <h2
            id={id}
            className="text-xs font-bold uppercase tracking-wider text-[#8C1D28] dark:text-rose-300"
          >
            {titulo}
          </h2>
        </div>
        {subtitulo && <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{subtitulo}</p>}
        {derecha && <div className="ml-auto">{derecha}</div>}
      </header>
      <div className={`flex min-h-0 flex-1 flex-col ${relleno ? "p-5" : "p-3"}`}>{children}</div>
    </section>
  );
}
