import Icono from "./Iconos";

// Ícono según la fuente del ítem (sin distinguir mayúsculas). Lo que no esté aquí usa "documento".
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

const CONTENEDOR = {
  normal: "border-transparent",
  relevante: "border-acento-borde bg-acento-tenue",
  evidencia: "border-acento-borde bg-acento-tenue",
  activa: "border-acento bg-acento-suave ring-[3px] ring-acento-borde",
  ruido: "border-transparent bg-sutil",
};

// Texto del estado: así nunca depende solo del color.
const ETIQUETA = {
  relevante: "Relevante",
  evidencia: "Evidencia",
  activa: "Evidencia · seleccionada",
  ruido: "Ruido",
};

/**
 * Lista resaltable genérica (señales, mensajes, filas de un documento…): cada ítem con fuente, texto y estado.
 * Sirve para cualquier desafío: "señales" del diseño 05 o los párrafos de un reclamo.
 * @param {object} props
 * @param {{id: string, fuente?: string, texto: React.ReactNode, meta?: string, hora?: string,
 *   estado?: "normal"|"relevante"|"ruido"|"evidencia"|"activa", motivo?: string,
 *   etiqueta?: string, icono?: string}[]} props.items
 *   `etiqueta` reemplaza el texto del estado (ej. "Falso positivo"); `motivo` explica el ruido; `icono` fuerza un ícono.
 * @param {(id: string) => void} [props.onSeleccionar]  si se pasa, cada ítem es un botón
 * @param {boolean} [props.mostrarId=true]  muestra el id (S1, S2…) para cruzarlo con la evidencia citada
 * @param {string} [props.className]
 */
export default function ListaSenales({ items = [], onSeleccionar, mostrarId = true, className = "" }) {
  return (
    <ul className={`flex flex-col gap-1.5 ${className}`}>
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
  const clases = `grid w-full grid-cols-[32px_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border-[1.5px] px-3 py-2 text-left ${
    CONTENEDOR[estado] || CONTENEDOR.normal
  }`;

  const contenido = (
    <>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-sutil text-texto2" title={item.fuente}>
        <Icono nombre={icono} className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className={`block text-[17px] leading-snug ${ruido ? "text-texto3 line-through decoration-borde-fuerte" : "text-texto"}`}>
          {mostrarId && !ruido && (
            <span className="mr-1.5 rounded-md bg-acento-suave px-1.5 py-px text-[13px] font-bold text-acento-osc no-underline">
              {item.id}
            </span>
          )}
          {item.fuente && !ruido && (
            <span className="mr-1.5 rounded-md bg-sutil px-1.5 py-px text-[13px] font-bold text-texto2">{item.fuente}</span>
          )}
          {item.texto}
        </span>
        {(etiqueta || item.meta || item.motivo) && (
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[14px] text-texto3">
            {etiqueta && (
              <span
                className={`rounded-md px-1.5 py-px text-[13px] font-bold ${
                  ruido ? "bg-borde text-texto2" : "bg-acento-suave text-acento-osc"
                }`}
              >
                {etiqueta}
              </span>
            )}
            {item.motivo && <span className="text-texto2">{item.motivo}</span>}
            {item.meta && <span>{item.meta}</span>}
          </span>
        )}
      </span>
      {item.hora ? <span className="text-[15px] tabular-nums text-texto3">{item.hora}</span> : <span />}
    </>
  );

  if (!onSeleccionar) return <div className={clases}>{contenido}</div>;
  return (
    <button
      type="button"
      onClick={() => onSeleccionar(item.id)}
      aria-pressed={estado === "activa"}
      className={`${clases} transition-colors hover:border-acento-borde motion-reduce:transition-none`}
    >
      {contenido}
    </button>
  );
}
