import Icono from "./Iconos";

/**
 * Evidencia citada por la IA como píldoras de filtro clicables (DESING.md §5.4.3).
 * Activa: `border-muni-primary-a11y bg-muni-primary-a11y text-white`.
 * Inactiva: sub-paleta Borgoña/Vino (`border-rose-200/90 bg-rose-50/40 text-[#8C1D28] hover:bg-rose-100/70`).
 */
export default function ChipsEvidencia({
  chips = [],
  activo,
  onSeleccionar,
  descartadas = 0,
  titulo = "Evidencia citada · verificada",
  dondeSeVerifico = "en el texto",
}) {
  const total = chips.length + descartadas;
  return (
    <div>
      {titulo && (
        <p className="mb-2 text-2xs font-bold uppercase tracking-wider text-[#8C1D28]/85 dark:text-rose-300/80">
          {titulo}
        </p>
      )}
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const esActivo = chip.id === activo;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={esActivo}
                onClick={() => onSeleccionar?.(chip.id)}
                className={`inline-flex min-h-8 max-w-full cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-left text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-[0.98] motion-reduce:transition-none ${
                  esActivo
                    ? "border-muni-primary-a11y bg-muni-primary-a11y text-white"
                    : "border-rose-200/90 bg-rose-50/40 text-[#8C1D28] hover:border-rose-300 hover:bg-rose-100/70 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-900/40"
                }`}
              >
                <b
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                    esActivo
                      ? "bg-white text-muni-primary-a11y-800"
                      : "bg-rose-100 text-[#6b151e] dark:bg-rose-900/60 dark:text-rose-100"
                  }`}
                >
                  {chip.id}
                </b>
                <span className="min-w-0 break-words">{chip.texto}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400">La IA no citó evidencia.</p>
      )}
      <p
        className={`mt-2 flex items-center gap-1.5 text-xs font-semibold tabular-nums ${
          descartadas > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"
        }`}
      >
        <Icono nombre={descartadas > 0 ? "alerta" : "check"} className="h-4 w-4" grosor={2.6} />
        {chips.length} de {total} evidencias verificadas {dondeSeVerifico} · {descartadas}{" "}
        {descartadas === 1 ? "descartada" : "descartadas"}
      </p>
    </div>
  );
}
