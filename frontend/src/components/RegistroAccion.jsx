import Icono from "./Iconos";

/**
 * Línea de tiempo de lo que pasó con una acción (propuesta → aprobada → ejecutada → verificada).
 * Lo que no ocurrió de verdad lleva la etiqueta SIMULADO: nunca se presenta como real.
 * @param {object} props
 * @param {{titulo: React.ReactNode, detalle?: React.ReactNode, hora?: string, simulado?: boolean,
 *   estado?: "hecho"|"error"}[]} props.items  estado "hecho" por defecto
 * @param {string} [props.className]
 */
export default function RegistroAccion({ items = [], className = "" }) {
  return (
    <ol className={`flex flex-col ${className}`}>
      {items.map((item, i) => {
        const error = item.estado === "error";
        return (
          <li
            key={i}
            className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-start gap-3 border-b border-borde py-3 text-[17px] last:border-b-0"
          >
            <span
              className={`grid h-7 w-7 place-items-center rounded-full ${error ? "bg-critico-fondo text-critico" : "bg-ok-fondo text-ok"}`}
            >
              <Icono nombre={error ? "cruz" : "check"} className="h-4 w-4" grosor={3.2} />
              <span className="sr-only">{error ? "con error" : "hecho"}</span>
            </span>
            <span className="min-w-0">
              <b className="font-bold text-texto">{item.titulo}</b>
              {item.simulado && (
                <span className="ml-2 whitespace-nowrap rounded-md border border-dashed border-borde-fuerte bg-sutil px-1.5 py-px align-[2px] text-[13px] font-extrabold tracking-wide text-texto2">
                  SIMULADO
                </span>
              )}
              {item.detalle && <span className="mt-0.5 block text-[15px] text-texto3">{item.detalle}</span>}
            </span>
            <span className="text-[15px] tabular-nums text-texto3">{item.hora}</span>
          </li>
        );
      })}
    </ol>
  );
}
