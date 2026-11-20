import AvisoEsperaLarga from "./AvisoEsperaLarga";
import Icono from "./Iconos";
import useTiempoTranscurrido, { SEGUNDOS_ESPERA_LARGA, segundosLegibles } from "./useTiempoTranscurrido";

/**
 * La espera como parte de la historia (diseño 05, paso 2): reloj grande + pasos y/o texto que llega por streaming.
 * Pasos SOLO si vienen de la IA (ej. streaming que pide pasos cortos): no inventar razonamiento.
 * @param {object} props
 * @param {boolean} [props.activo=true]  corre el reloj; al pasar a false se congela
 * @param {number} [props.segundos]  fija el reloj (galería o duración final); si falta, se mide solo
 * @param {{texto: React.ReactNode, estado: "hecho"|"en_curso"|"pendiente"}[]} [props.pasos]
 * @param {string} [props.texto]  texto acumulado del streaming (muestra cursor mientras está activo)
 * @param {string} [props.etiqueta="Esperando a la IA"]  qué se espera (texto bajo el reloj)
 */
export default function RazonamientoEnVivo({ activo = true, segundos, pasos = [], texto, etiqueta = "Esperando a la IA" }) {
  const medidos = useTiempoTranscurrido(activo && segundos == null);
  const ms = segundos != null ? segundos * 1000 : medidos;
  const largo = activo && ms / 1000 >= SEGUNDOS_ESPERA_LARGA;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p aria-hidden="true" className="text-[64px] font-extrabold leading-none tracking-tight text-acento-osc tabular-nums">
          {segundosLegibles(ms)} <small className="text-[26px] font-bold text-texto2">s</small>
        </p>
        <p role="status" className="mt-1.5 flex items-center gap-2 text-[17px] text-texto2">
          {activo && (
            <span aria-hidden="true" className="h-2.5 w-2.5 animate-pulso rounded-full bg-acento motion-reduce:animate-none" />
          )}
          {activo ? `${etiqueta}…` : "Listo"}
        </p>
      </div>

      {pasos.length > 0 && (
        <ol className="flex flex-col gap-3 text-[19px]">
          {pasos.map((paso, i) => (
            <li key={i} className="flex items-start gap-3 leading-snug">
              <MarcaPaso estado={paso.estado} />
              <span className={paso.estado === "pendiente" ? "text-texto3" : "text-texto"}>{paso.texto}</span>
            </li>
          ))}
        </ol>
      )}

      {texto != null && (
        <p className="whitespace-pre-wrap text-[18px] leading-relaxed text-texto">
          {texto}
          {activo && (
            <span
              aria-hidden="true"
              className="ml-1 inline-block h-[22px] w-2.5 animate-pulso bg-acento align-[-4px] motion-reduce:animate-none"
            />
          )}
        </p>
      )}

      {largo && <AvisoEsperaLarga />}
    </div>
  );
}

function MarcaPaso({ estado }) {
  if (estado === "hecho") {
    return (
      <span className="mt-0.5 grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-ok-fondo text-ok">
        <Icono nombre="check" className="h-4 w-4" grosor={3.2} />
        <span className="sr-only">hecho:</span>
      </span>
    );
  }
  if (estado === "en_curso") {
    return (
      <span className="mt-0.5 h-[26px] w-[26px] shrink-0 animate-spin rounded-full border-[3px] border-acento-borde border-t-acento motion-reduce:animate-none">
        <span className="sr-only">en curso:</span>
      </span>
    );
  }
  return (
    <span className="mt-0.5 h-[26px] w-[26px] shrink-0 rounded-full border-2 border-dashed border-borde-fuerte">
      <span className="sr-only">pendiente:</span>
    </span>
  );
}
