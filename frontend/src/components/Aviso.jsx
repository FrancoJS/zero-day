import Icono from "./Iconos";

const TONOS = {
  info: ["bg-acento-suave text-acento-osc", "info"],
  ok: ["bg-ok-fondo text-ok", "check"],
  adv: ["bg-adv-fondo text-adv", "reloj"],
  error: ["border-2 border-critico-borde bg-critico-fondo text-critico", "error"],
};

/**
 * Caja de aviso con ícono (los ".aviso" del diseño 05): espera larga, datos-no-instrucciones, simulado, error.
 * @param {object} props
 * @param {"info"|"ok"|"adv"|"error"} [props.tono="info"]
 * @param {string} [props.icono]  reemplaza el ícono por defecto del tono
 * @param {React.ReactNode} [props.titulo]  línea en negrita sobre el contenido
 * @param {string} [props.role]  ej. "alert" para errores
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export default function Aviso({ tono = "info", icono, titulo, role, className = "", children }) {
  const [clases, iconoTono] = TONOS[tono] || TONOS.info;
  return (
    <div role={role} className={`flex items-start gap-3 rounded-xl px-4 py-3.5 text-[17px] leading-snug ${clases} ${className}`}>
      <Icono nombre={icono || iconoTono} className="mt-0.5 h-6 w-6" grosor={2.2} />
      <div className="min-w-0 flex-1">
        {titulo && <p className="mb-1 text-[19px] font-extrabold">{titulo}</p>}
        {children}
      </div>
    </div>
  );
}
