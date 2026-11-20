import AvisoEsperaLarga from "./AvisoEsperaLarga";
import useTiempoTranscurrido, { SEGUNDOS_ESPERA_LARGA } from "./useTiempoTranscurrido";

/**
 * Indicador de carga compacto con segundos transcurridos (`tabular-nums`, DESING.md §3).
 */
export default function Cargando({ texto = "Esperando a la IA" }) {
  const segundos = Math.floor(useTiempoTranscurrido(true, 1000) / 1000);

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <p className="flex items-center gap-3 text-sm sm:text-base text-gray-600 dark:text-gray-300">
        <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-rose-200 border-t-muni-primary motion-reduce:animate-none dark:border-rose-900 dark:border-t-rose-400" />
        <span>
          {texto}… <b className="font-bold tabular-nums text-gray-900 dark:text-white">{segundos} s</b>
        </span>
      </p>
      {segundos >= SEGUNDOS_ESPERA_LARGA && <AvisoEsperaLarga />}
    </div>
  );
}
