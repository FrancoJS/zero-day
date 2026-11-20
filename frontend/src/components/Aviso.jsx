import Icono from "./Iconos";

// Callout boxes semánticos según DESING.md §2.4 y §6.2 (.informacion, .destacado, .restriccion, éxito emerald):
const TONOS = {
  info: ["informacion", "info", "text-blue-700 dark:text-blue-300"],
  ok: [
    "rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-100",
    "check",
    "text-emerald-700 dark:text-emerald-300",
  ],
  adv: ["destacado", "reloj", "text-amber-700 dark:text-amber-300"],
  error: ["restriccion", "error", "text-red-700 dark:text-red-300"],
};

/**
 * Callout semántico con ícono (DESING.md §6.2: `.informacion`, `.destacado`, `.restriccion` y éxito `emerald`).
 * @param {object} props
 * @param {"info"|"ok"|"adv"|"error"} [props.tono="info"]
 * @param {string} [props.icono]
 * @param {React.ReactNode} [props.titulo]
 * @param {string} [props.role]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export default function Aviso({ tono = "info", icono, titulo, role, className = "", children }) {
  const [clases, iconoTono, colorIcono] = TONOS[tono] || TONOS.info;
  return (
    <div role={role} className={`flex items-start gap-3 ${clases} ${className}`}>
      <Icono nombre={icono || iconoTono} className={`mt-0.5 h-5 w-5 shrink-0 ${colorIcono}`} grosor={2.2} />
      <div className="min-w-0 flex-1">
        {titulo && <p className="mb-1 text-base font-bold">{titulo}</p>}
        {children}
      </div>
    </div>
  );
}
