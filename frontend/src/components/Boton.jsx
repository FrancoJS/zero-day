import { useId } from "react";
import Icono from "./Iconos";

// Botones institucionales según DESING.md §2.1, §2.2 y §6.2:
// - primario: usa `muni-primary-a11y` (#ae0101, WCAG AA >= 4.5:1 con blanco) y hover `muni-primary-700` (#d90000).
// - secundario: `.btn-gris-xl` (border-gray-300 bg-white text-gray-700 hover:bg-gray-50).
// - vino: botón sólido Borgoña (`bg-[#8C1D28] hover:bg-[#a5222f] text-white`).
// - peligro: acción destructiva/rechazo en tonos red/rose.
const VARIANTES = {
  primario:
    "border-muni-primary-a11y bg-muni-primary-a11y text-white shadow-xs hover:border-muni-primary-700 hover:bg-muni-primary-700",
  secundario:
    "border-gray-300 bg-white text-gray-700 shadow-xs hover:bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800",
  vino:
    "border-[#8C1D28] bg-[#8C1D28] text-white shadow-xs hover:border-[#a5222f] hover:bg-[#a5222f] dark:border-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500",
  peligro:
    "border-red-200 bg-red-50/70 text-red-800 hover:border-red-300 hover:bg-red-100/80 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-900/40",
};

const TAMANOS = {
  normal: "px-4 py-2 text-sm rounded-lg",
  grande: "px-5 py-3 text-base rounded-lg",
};

/**
 * Botón del kit con identidad municipal (DESING.md §2.1, §6.2).
 * Si está deshabilitado, explica por qué (title + aria-describedby).
 */
export default function Boton({
  variante = "secundario",
  tamano = "normal",
  icono,
  disabled,
  motivoDeshabilitado,
  ancho,
  type = "button",
  className = "",
  children,
  ...resto
}) {
  const idMotivo = useId();
  const conMotivo = disabled && motivoDeshabilitado;
  return (
    <>
      <button
        type={type}
        disabled={disabled}
        title={conMotivo ? motivoDeshabilitado : undefined}
        aria-describedby={conMotivo ? idMotivo : undefined}
        className={`inline-flex cursor-pointer items-center justify-center gap-2 border font-semibold leading-tight transition-all duration-150 active:scale-[0.98] motion-reduce:transition-none disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none disabled:active:scale-100 dark:disabled:border-gray-800 dark:disabled:bg-gray-800/60 dark:disabled:text-gray-500 ${
          VARIANTES[variante] || VARIANTES.secundario
        } ${TAMANOS[tamano] || TAMANOS.normal} ${ancho ? "w-full" : ""} ${className}`}
        {...resto}
      >
        {icono && <Icono nombre={icono} className="h-4.5 w-4.5" grosor={2.2} />}
        {children}
      </button>
      {conMotivo && (
        <span id={idMotivo} className="sr-only">
          {motivoDeshabilitado}
        </span>
      )}
    </>
  );
}
