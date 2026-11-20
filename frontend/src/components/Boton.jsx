import { useId } from "react";
import Icono from "./Iconos";

const VARIANTES = {
  primario: "border-acento bg-acento text-white hover:border-acento-osc hover:bg-acento-osc",
  secundario: "border-borde bg-superficie text-texto hover:bg-sutil",
  peligro: "border-critico-borde bg-superficie text-critico hover:bg-critico-fondo",
};

const TAMANOS = {
  normal: "px-4 py-2.5 text-[17px]",
  grande: "px-5 py-3.5 text-[20px]",
};

/**
 * Botón del kit. Si está deshabilitado, explica por qué (title + aria-describedby).
 * @param {object} props
 * @param {"primario"|"secundario"|"peligro"} [props.variante="secundario"]  usar UN solo primario por pantalla
 * @param {"normal"|"grande"} [props.tamano="normal"]
 * @param {string} [props.icono]  nombre de ícono de Iconos.jsx
 * @param {boolean} [props.disabled]
 * @param {string} [props.motivoDeshabilitado]  por qué no se puede usar (ej. "Escribe un texto primero")
 * @param {boolean} [props.ancho]  ocupa todo el ancho disponible
 * @param {"button"|"submit"} [props.type="button"]
 * @param {Function} [props.onClick]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
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
        className={`inline-flex items-center justify-center gap-2 rounded-xl border-2 font-bold leading-tight transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:border-borde disabled:bg-sutil disabled:text-texto3 ${
          VARIANTES[variante] || VARIANTES.secundario
        } ${TAMANOS[tamano] || TAMANOS.normal} ${ancho ? "w-full" : ""} ${className}`}
        {...resto}
      >
        {icono && <Icono nombre={icono} className="h-5 w-5" grosor={2.6} />}
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
