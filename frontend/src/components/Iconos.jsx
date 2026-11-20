// Íconos SVG en línea del kit (sin dependencias). Trazos tomados de los diseños 04 y 05.
// Siempre decorativos (aria-hidden): el significado lo lleva el texto que los acompaña.

const TRAZOS = {
  check: <path d="M5 12l5 5 9-10" />,
  cruz: <path d="M6 6l12 12M18 6L6 18" />,
  alerta: (
    <>
      <path d="M12 3l9 16H3z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 16.5h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5h.01" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  candado: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  log: <path d="M4 6h16M4 12h16M4 18h10" />,
  despliegue: <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />,
  ticket: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M9 6v12" />
    </>
  ),
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  vacio: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 12h8M12 8v8" />
    </>
  ),
  reintentar: (
    <>
      <path d="M4 12a8 8 0 0 1 14-5.3L20 9" />
      <path d="M20 4v5h-5" />
      <path d="M20 12a8 8 0 0 1-14 5.3L4 15" />
      <path d="M4 20v-5h5" />
    </>
  ),
  editar: <path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" />,
  documento: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9 12h7M9 16h7" />
    </>
  ),
  chispa: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />,
};

/**
 * Ícono SVG del kit.
 * @param {object} props
 * @param {keyof typeof TRAZOS} props.nombre  check | cruz | alerta | error | info | reloj | candado | log | despliegue | ticket | chat | vacio | reintentar | editar | documento | chispa
 * @param {string} [props.className]  tamaño y color (por defecto h-5 w-5, hereda el color del texto)
 * @param {number} [props.grosor]  grosor del trazo (2 por defecto)
 */
export default function Icono({ nombre, className = "h-5 w-5", grosor = 2 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {TRAZOS[nombre] || TRAZOS.info}
    </svg>
  );
}

/** Logo de Zero Day (cuadrado cobalto con la Z). */
export function LogoZeroDay({ className = "h-9 w-9" }) {
  return (
    <svg viewBox="0 0 34 34" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      <rect width="34" height="34" rx="9" fill="#2952E3" />
      <path d="M10 11h14L10 23h14" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const NOMBRES_ICONOS = Object.keys(TRAZOS);
