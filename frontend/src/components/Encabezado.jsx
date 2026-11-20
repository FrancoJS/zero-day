import { LogoZeroDay } from "./Iconos";

/**
 * Navbar Institucional (DESING.md §5.1):
 * Gradiente `.cta-bg` (from-muni-primary to-muni-primary-900), logo blanco + separador vertical `bg-white/30`
 * + doble línea (sobretítulo uppercase tracking-[0.18em] + título de producto) y estado a la derecha.
 * @param {object} props
 * @param {React.ReactNode} [props.producto]
 * @param {React.ReactNode} [props.children]  lado derecho (normalmente <IndicadorModo />)
 * @param {string} [props.className]
 */
export default function Encabezado({ producto, children, className = "" }) {
  return (
    <header
      className={`sticky top-0 z-40 flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-white/10 py-3.5 text-white shadow-md transition-shadow duration-200 print:hidden cta-bg ${className}`}
    >
      <div className="flex items-center gap-3">
        <LogoZeroDay invertido className="h-9 w-9 sm:h-10 sm:w-10" />
        <div className="leading-tight">
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-white/75">
            Municipalidad de Rancagua
          </p>
          <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">Zero Day</h1>
        </div>
      </div>
      {producto && (
        <>
          <span aria-hidden="true" className="hidden h-8 w-px bg-white/30 sm:block" />
          <div className="text-sm font-medium text-muni-primary-100 sm:text-base [&_b]:font-bold [&_b]:text-white">
            {producto}
          </div>
        </>
      )}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </header>
  );
}
