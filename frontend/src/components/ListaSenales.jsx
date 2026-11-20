import Icono from "./Iconos";

const ICONO_FUENTE = {
  log: "log",
  alerta: "alerta",
  monitoreo: "alerta",
  despliegue: "despliegue",
  ticket: "ticket",
  soporte: "ticket",
  chat: "chat",
  mensaje: "chat",
  correo: "chat",
};

// Superficies según DESING.md §2.1, §2.2 y §6.2 (.item-destacado, sub-paleta Borgoña/Vino)
const CONTENEDOR = {
  normal: "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900",
  relevante:
    "border-rose-200/80 bg-rose-50/25 hover:border-rose-300 hover:bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20",
  evidencia:
    "border-rose-200/80 bg-rose-50/35 hover:border-rose-300 hover:bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/25",
  activa:
    "border-muni-primary bg-muni-primary/10 ring-2 ring-muni-primary/20 shadow-xs dark:border-rose-400 dark:bg-muni-primary/20",
  ruido: "border-gray-100 bg-gray-50/80 dark:border-gray-800/60 dark:bg-gray-900/40",
};

const ETIQUETA = {
  relevante: "Relevante",
  evidencia: "Evidencia",
  activa: "Evidencia · seleccionada",
  ruido: "Ruido",
};

/**
 * Lista resaltable genérica con identidad municipal (DESING.md §2.2, §6.2).
 */
export default function ListaSenales({ items = [], onSeleccionar, mostrarId = true, className = "" }) {
  return (
    <ul className={`flex flex-col gap-2 ${className}`}>
      {items.map((item) => (
        <li key={item.id}>
          <Senal item={item} onSeleccionar={onSeleccionar} mostrarId={mostrarId} />
        </li>
      ))}
    </ul>
  );
}

function Senal({ item, onSeleccionar, mostrarId }) {
  const estado = item.estado || "normal";
  const ruido = estado === "ruido";
  const icono = item.icono || ICONO_FUENTE[(item.fuente || "").toLowerCase()] || "documento";
  const etiqueta = item.etiqueta || ETIQUETA[estado];
  const clases = `grid w-full grid-cols-[32px_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
    CONTENEDOR[estado] || CONTENEDOR.normal
  }`;

  const contenido = (
    <>
      <span
        className={`grid h-8 w-8 place-items-center rounded-lg ${
          ruido
            ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
            : "bg-rose-50 text-[#8C1D28] dark:bg-rose-950/50 dark:text-rose-300"
        }`}
        title={item.fuente}
      >
        <Icono nombre={icono} className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span
          className={`block text-sm sm:text-base leading-snug ${
            ruido ? "text-gray-400 line-through decoration-gray-300 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {mostrarId && !ruido && (
            <span className="mr-1.5 rounded-md bg-muni-primary/10 px-1.5 py-0.5 text-xs font-bold tabular-nums text-muni-primary-a11y-800 no-underline dark:bg-muni-primary/25 dark:text-muni-primary-300">
              {item.id}
            </span>
          )}
          {item.fuente && !ruido && (
            <span className="mr-1.5 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {item.fuente}
            </span>
          )}
          {item.texto}
        </span>
        {(etiqueta || item.meta || item.motivo) && (
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
            {etiqueta && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                  ruido
                    ? "bg-gray-200/80 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    : "bg-rose-100/80 text-[#8C1D28] dark:bg-rose-950/60 dark:text-rose-200"
                }`}
              >
                {etiqueta}
              </span>
            )}
            {item.motivo && <span className="text-gray-600 dark:text-gray-300">{item.motivo}</span>}
            {item.meta && <span>{item.meta}</span>}
          </span>
        )}
      </span>
      {item.hora ? (
        <span className="text-xs font-medium tabular-nums text-gray-500 dark:text-gray-400">{item.hora}</span>
      ) : (
        <span />
      )}
    </>
  );

  if (!onSeleccionar) return <div className={clases}>{contenido}</div>;
  return (
    <button
      type="button"
      onClick={() => onSeleccionar(item.id)}
      aria-pressed={estado === "activa"}
      className={`${clases} cursor-pointer motion-reduce:transition-none`}
    >
      {contenido}
    </button>
  );
}
