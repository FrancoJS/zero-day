import Icono from "./Iconos";

/**
 * Estado vacío con esfera de ícono (`strokeWidth={1.5}` según DESING.md §1)
 * y ejemplos clicables con la estética de QuickStats / Accesos Directos (DESING.md §5.2).
 */
export default function EstadoVacio({
  icono = "vacio",
  mensaje,
  detalle,
  ejemplos = [],
  onEjemplo,
  tituloEjemplos = "Prueba con un ejemplo",
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 py-5 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200/80 bg-rose-50/50 text-[#8C1D28]/80 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
        <Icono nombre={icono} className="h-6 w-6" grosor={1.5} />
      </span>
      <p className="text-base font-bold text-gray-900 dark:text-gray-100">{mensaje}</p>
      {detalle && <p className="max-w-md text-sm leading-relaxed text-gray-600 dark:text-gray-300">{detalle}</p>}
      {ejemplos.length > 0 && (
        <div className="mt-2 flex w-full flex-col gap-2 text-left">
          <p className="text-2xs font-bold uppercase tracking-wider text-[#8C1D28]/85 dark:text-rose-300/80">
            {tituloEjemplos}
          </p>
          {ejemplos.map((ejemplo) => (
            <button
              key={ejemplo}
              type="button"
              onClick={() => onEjemplo?.(ejemplo)}
              className="cursor-pointer rounded-xl border border-rose-200/80 bg-rose-50/25 px-3.5 py-2.5 text-left text-xs sm:text-sm leading-snug text-gray-800 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50/70 hover:text-[#8C1D28] hover:shadow-sm active:scale-[0.99] motion-reduce:transition-none dark:border-rose-900/50 dark:bg-gray-800/40 dark:text-gray-200 dark:hover:border-rose-700/80 dark:hover:bg-rose-950/30 dark:hover:text-rose-200"
            >
              {ejemplo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
