import Icono from "./Iconos";

// Tonos de insignia según DESING.md §2.1, §2.2 y §2.4:
// [clases base (fondo + texto), borde]
const TONOS = {
  ok: [
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200",
    "border-emerald-300 dark:border-emerald-800",
  ],
  adv: [
    "bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200",
    "border-amber-300 dark:border-amber-800",
  ],
  parcial: [
    "bg-orange-100 text-orange-900 dark:bg-orange-950/70 dark:text-orange-200",
    "border-orange-300 dark:border-orange-800",
  ],
  critico: [
    "bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-200",
    "border-red-300 dark:border-red-800",
  ],
  neutro: [
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    "border-gray-300 dark:border-gray-700",
  ],
  acento: [
    "bg-muni-primary/10 text-muni-primary-a11y-800 dark:bg-muni-primary/25 dark:text-muni-primary-300",
    "border-muni-primary/25 dark:border-muni-primary/40",
  ],
  vino: [
    "bg-rose-50/90 text-[#8C1D28] dark:bg-rose-950/40 dark:text-rose-200",
    "border-rose-200/90 dark:border-rose-900/60",
  ],
};

/**
 * Etiqueta o píldora de estado (DESING.md §2.1, §2.4).
 * El estado NUNCA va solo en el color: siempre lleva texto (y opcionalmente ícono o punto).
 * @param {object} props
 * @param {"ok"|"adv"|"parcial"|"critico"|"neutro"|"acento"|"vino"} [props.tono="neutro"]
 * @param {string} [props.icono]
 * @param {boolean} [props.punto]
 * @param {boolean} [props.pulso]
 * @param {"pastilla"|"etiqueta"} [props.forma="etiqueta"]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export default function Insignia({ tono = "neutro", icono, punto, pulso, forma = "etiqueta", className = "", children }) {
  const [colores, borde] = TONOS[tono] || TONOS.neutro;
  const formaClases =
    forma === "pastilla"
      ? `rounded-full border ${borde} px-3.5 py-1 text-xs sm:text-sm font-semibold shadow-xs`
      : `rounded-lg border ${borde} px-2.5 py-1 text-xs sm:text-sm font-bold`;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap leading-snug ${colores} ${formaClases} ${className}`}>
      {punto && (
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 shrink-0 rounded-full bg-current ${pulso ? "animate-pulso motion-reduce:animate-none" : ""}`}
        />
      )}
      {icono && <Icono nombre={icono} className="h-4 w-4" grosor={2.3} />}
      {children}
    </span>
  );
}
