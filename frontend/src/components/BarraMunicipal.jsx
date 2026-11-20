import { useEffect, useState } from "react";

const VISTAS = [
  { id: "vecino", nombre: "Vecino", detalle: "Reportar un microbasural" },
  { id: "encargado", nombre: "Encargado", detalle: "Gestión de Calidad" },
];

/**
 * Navbar institucional de Rancagua reutilizable en todas las vistas:
 * - Sticky header con `.cta-bg` (gradiente municipal) y borde inferior sutil con sombra al hacer scroll.
 * - Logo oficial blanco `logo-muni-blanco.png` con separador vertical `bg-white/30`.
 * - Título doble línea institucional (sobretítulo uppercase tracking-[0.18em] + título de la plataforma).
 * - Selector de vistas (Vecino / Encargado) tipo píldora municipal interactivo.
 *
 * @param {object} props
 * @param {"vecino" | "encargado"} [props.vista] Vista actual activa (opcional, si no se pasa detecta URL)
 * @param {React.ReactNode} [props.children] Acciones adicionales al extremo derecho (opcional)
 * @param {string} [props.className] Clases adicionales de estilo
 */
export default function BarraMunicipal({ vista: vistaProp, children, className = "" }) {
  const [isScrolled, setIsScrolled] = useState(false);

  // Si no viene vista por prop, leer de URL o default a "vecino"
  const vistaActual =
    vistaProp ||
    (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("vista") === "encargado"
      ? "encargado"
      : "vecino");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-shadow duration-200 print:hidden cta-bg border-b border-white/10 ${
        isScrolled ? "shadow-lg" : "shadow-none"
      } ${className}`}
    >
      <div className="container flex items-center justify-between gap-4 py-2 sm:py-2.5">
        {/* Lado izquierdo: Logo oficial + Identidad */}
        <div className="flex items-center min-w-0">
          <a
            href="/"
            aria-label="Ir al inicio - Gestión de Microbasurales"
            className="flex items-center gap-3 sm:gap-4 rounded-lg py-1 pr-1 text-white shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <img
              src="/logo-muni-blanco.png"
              alt="Municipalidad de Rancagua"
              className="w-auto h-8 sm:h-9 object-contain transition-transform duration-200 group-hover:scale-101"
            />

            {/* Separador vertical y subtítulos */}
            <span aria-hidden="true" className="hidden sm:block h-8 w-px bg-white/30" />
            <div className="hidden sm:flex flex-col gap-1 leading-none">
              <span className="text-2xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Municipalidad de Rancagua
              </span>
              <span className="text-base font-semibold tracking-tight text-white">
                Gestión de Microbasurales
              </span>
            </div>
          </a>
        </div>

        {/* Lado derecho: Selector sutil a la derecha + children opcionales */}
        <div className="flex items-center gap-3 shrink-0">
          {children}

          <nav
            aria-label="Vistas de la plataforma"
            className="flex items-center gap-0.5 rounded-lg border border-white/15 bg-black/10 p-1 backdrop-blur-xs"
          >
            {VISTAS.map((v) => {
              const activa = v.id === vistaActual;
              return (
                <a
                  key={v.id}
                  href={`?vista=${v.id}`}
                  aria-current={activa ? "page" : undefined}
                  title={v.detalle}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    activa
                      ? "bg-white/20 text-white shadow-xs font-semibold"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {v.nombre}
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
