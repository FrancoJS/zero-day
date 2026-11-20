import AvisoEsperaLarga from "./AvisoEsperaLarga";
import useTiempoTranscurrido, { SEGUNDOS_ESPERA_LARGA } from "./useTiempoTranscurrido";

/**
 * Indicador de carga compacto con segundos transcurridos (para espacios chicos).
 * Para la espera principal de la demo usar RazonamientoEnVivo (reloj grande).
 * @param {object} props
 * @param {string} [props.texto="Esperando a la IA"]
 */
export default function Cargando({ texto = "Esperando a la IA" }) {
  const segundos = Math.floor(useTiempoTranscurrido(true, 1000) / 1000);

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <p className="flex items-center gap-3 text-[18px] text-texto2">
        <span className="h-6 w-6 shrink-0 animate-spin rounded-full border-[3px] border-acento-borde border-t-acento motion-reduce:animate-none" />
        <span>
          {texto}… <b className="tabular-nums text-texto">{segundos} s</b>
        </span>
      </p>
      {segundos >= SEGUNDOS_ESPERA_LARGA && <AvisoEsperaLarga />}
    </div>
  );
}
