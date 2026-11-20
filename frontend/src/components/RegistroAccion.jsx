import Icono from "./Iconos";

/**
 * Línea de tiempo de lo que pasó con una acción (propuesta → aprobada → ejecutada → verificada).
 * Usa estados semánticos emerald / red y `tabular-nums` en horas (DESING.md §2.4, §3).
 */
export default function RegistroAccion({ items = [], className = "" }) {
  return (
    <ol className={`flex flex-col ${className}`}>
      {items.map((item, i) => {
        const error = item.estado === "error";
        return (
          <li
            key={i}
            className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-3 border-b border-gray-100 py-3 text-sm last:border-b-0 dark:border-gray-800"
          >
            <span
              className={`grid h-6 w-6 place-items-center rounded-full ${
                error
                  ? "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
              }`}
            >
              <Icono nombre={error ? "cruz" : "check"} className="h-3.5 w-3.5" grosor={3} />
              <span className="sr-only">{error ? "con error" : "hecho"}</span>
            </span>
            <span className="min-w-0">
              <b className="font-semibold text-gray-900 dark:text-gray-100">{item.titulo}</b>
              {item.simulado && (
                <span className="ml-2 whitespace-nowrap rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 align-[1px] text-[11px] font-bold tracking-wide text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                  SIMULADO
                </span>
              )}
              {item.detalle && <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{item.detalle}</span>}
            </span>
            <span className="text-xs font-medium tabular-nums text-gray-500 dark:text-gray-400">{item.hora}</span>
          </li>
        );
      })}
    </ol>
  );
}
