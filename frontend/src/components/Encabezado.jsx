import { LogoZeroDay } from "./Iconos";

/**
 * Barra superior blanca: marca Zero Day + producto + espacio a la derecha (IndicadorModo).
 * @param {object} props
 * @param {React.ReactNode} [props.producto]  ej. <><b>Centinela</b> · respuesta a incidentes</>
 * @param {React.ReactNode} [props.children]  lado derecho (normalmente <IndicadorModo />)
 * @param {string} [props.className]  ej. padding horizontal
 */
export default function Encabezado({ producto, children, className = "" }) {
  return (
    <header
      className={`flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-borde bg-superficie py-4 ${className}`}
    >
      <div className="flex items-center gap-3 text-[22px] font-extrabold tracking-tight text-texto">
        <LogoZeroDay />
        <h1>Zero Day</h1>
      </div>
      {producto && <p className="text-[18px] text-texto2 sm:border-l sm:border-borde sm:pl-5">{producto}</p>}
      <div className="ml-auto">{children}</div>
    </header>
  );
}
