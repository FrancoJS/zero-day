// Íconos del kit sobre lucide-react (imports nombrados obligatorios, DESING.md §1).
// API estable: <Icono nombre="check" /> y NOMBRES_ICONOS. Siempre decorativos (aria-hidden="true").
import {
  Check,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  Lock,
  Logs,
  Download,
  Ticket,
  MessageSquare,
  SquarePlus,
  RotateCcw,
  Pencil,
  FileText,
  Sparkles,
} from "lucide-react";

const ICONOS = {
  check: Check,
  cruz: X,
  alerta: AlertTriangle,
  error: AlertCircle,
  info: Info,
  reloj: Clock,
  candado: Lock,
  log: Logs,
  despliegue: Download,
  ticket: Ticket,
  chat: MessageSquare,
  vacio: SquarePlus,
  reintentar: RotateCcw,
  editar: Pencil,
  documento: FileText,
  chispa: Sparkles,
};

/**
 * Ícono del kit (lucide-react).
 * @param {object} props
 * @param {keyof typeof ICONOS} props.nombre
 * @param {string} [props.className]  tamaño y color (por defecto h-5 w-5)
 * @param {number} [props.grosor]  strokeWidth (2 por defecto; 1.5 en esferas/placeholders grandes según DESING.md §1)
 */
export default function Icono({ nombre, className = "h-5 w-5", grosor = 2 }) {
  const Componente = ICONOS[nombre] || Info;
  return <Componente aria-hidden="true" focusable="false" strokeWidth={grosor} className={`shrink-0 ${className}`} />;
}

/**
 * Emblema institucional Zero Day · Municipalidad de Rancagua.
 * `invertido` = contenedor translúcido blanco sobre el Navbar `.cta-bg` (DESING.md §5.1).
 */
export function LogoZeroDay({ className = "h-9 w-9", invertido = false }) {
  if (invertido) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/15 text-white shadow-xs ${className}`}
      >
        <svg viewBox="0 0 34 34" focusable="false" className="h-6 w-6">
          <path
            d="M9 10.5h16L9 23.5h16"
            stroke="currentColor"
            strokeWidth="3.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  return (
    <svg viewBox="0 0 34 34" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      <rect width="34" height="34" rx="9" fill="#C30101" />
      <path d="M10 11h14L10 23h14" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const NOMBRES_ICONOS = Object.keys(ICONOS);
