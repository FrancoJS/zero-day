import AvisoEsperaLarga from "./AvisoEsperaLarga";
import Icono from "./Iconos";
import useTiempoTranscurrido, { SEGUNDOS_ESPERA_LARGA, segundosLegibles } from "./useTiempoTranscurrido";

/**
 * Espera visible con cronómetro `tabular-nums` en tono Borgoña/Vino (`#8C1D28`) y pasos (DESING.md §2.2, §3).
 */
export default function RazonamientoEnVivo({ activo = true, segundos, pasos = [], texto, etiqueta = "Esperando a la IA" }) {
  const medidos = useTiempoTranscurrido(activo && segundos == null);
  const ms = segundos != null ? segundos * 1000 : medidos;
  const largo = activo && ms / 1000 >= SEGUNDOS_ESPERA_LARGA;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-rose-200/80 bg-rose-50/25 p-4 dark:border-rose-900/40 dark:bg-gray-800/40">
        <p
          aria-hidden="true"
          className="text-5xl font-extrabold leading-none tracking-tight text-[#8C1D28] tabular-nums dark:text-rose-300"
        >
          {segundosLegibles(ms)} <small className="text-xl font-bold text-gray-500 dark:text-gray-400">s</small>
        </p>
        <p role="status" className="mt-1.5 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          {activo && (
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 animate-pulso rounded-full bg-muni-primary motion-reduce:animate-none"
            />
          )}
          {activo ? `${etiqueta}…` : "Listo"}
        </p>
      </div>

      {pasos.length > 0 && (
        <ol className="flex flex-col gap-2.5 text-sm sm:text-base">
          {pasos.map((paso, i) => (
            <li key={i} className="flex items-start gap-2.5 leading-snug">
              <MarcaPaso estado={paso.estado} />
              <span
                className={
                  paso.estado === "pendiente"
                    ? "text-gray-400 dark:text-gray-500"
                    : "text-gray-800 dark:text-gray-200"
                }
              >
                {paso.texto}
              </span>
            </li>
          ))}
        </ol>
      )}

      {texto != null && (
        <p className="whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 text-sm sm:text-base leading-relaxed text-gray-800 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200">
          {texto}
          {activo && (
            <span
              aria-hidden="true"
              className="ml-1 inline-block h-4.5 w-2 animate-pulso bg-muni-primary align-[-3px] motion-reduce:animate-none"
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
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
        <Icono nombre="check" className="h-3.5 w-3.5" grosor={3} />
        <span className="sr-only">hecho:</span>
      </span>
    );
  }
  if (estado === "en_curso") {
    return (
      <span className="mt-0.5 h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-rose-200 border-t-muni-primary motion-reduce:animate-none dark:border-rose-900 dark:border-t-rose-400">
        <span className="sr-only">en curso:</span>
      </span>
    );
  }
  return (
    <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-dashed border-gray-300 dark:border-gray-700">
      <span className="sr-only">pendiente:</span>
    </span>
  );
}
