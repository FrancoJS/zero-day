import Icono from "./Iconos";

// [fondo y texto, borde (solo forma pastilla)]
const TONOS = {
  ok: ["bg-ok-fondo text-ok", "border-ok-borde"],
  adv: ["bg-adv-fondo text-adv", "border-adv-borde"],
  parcial: ["bg-parcial-fondo text-parcial", "border-parcial-borde"],
  critico: ["bg-critico-fondo text-critico", "border-critico-borde"],
  neutro: ["bg-sutil text-texto2", "border-borde"],
  acento: ["bg-acento-suave text-acento-osc", "border-acento-borde"],
};

/**
 * Etiqueta de estado. El estado NUNCA va solo en el color: siempre lleva texto (y mejor un ícono).
 * @param {object} props
 * @param {"ok"|"adv"|"parcial"|"critico"|"neutro"|"acento"} [props.tono="neutro"]
 * @param {string} [props.icono]  nombre de ícono de Iconos.jsx (ej. "alerta", "check")
 * @param {boolean} [props.punto]  punto de color a la izquierda (estilo indicador LIVE/MOCK)
 * @param {boolean} [props.pulso]  el punto late (respeta prefers-reduced-motion)
 * @param {"pastilla"|"etiqueta"} [props.forma="etiqueta"]  pastilla = redonda con borde (encabezado); etiqueta = rectangular (severidad, riesgo)
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children  el texto
 */
export default function Insignia({ tono = "neutro", icono, punto, pulso, forma = "etiqueta", className = "", children }) {
  const [colores, borde] = TONOS[tono] || TONOS.neutro;
  const formaClases =
    forma === "pastilla" ? `rounded-full border-[1.5px] ${borde} px-3.5 py-1 font-semibold` : "rounded-lg px-3 py-1 font-bold";
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap text-base leading-snug ${colores} ${formaClases} ${className}`}>
      {punto && (
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 shrink-0 rounded-full bg-current ${pulso ? "animate-pulso motion-reduce:animate-none" : ""}`}
        />
      )}
      {icono && <Icono nombre={icono} className="h-[18px] w-[18px]" grosor={2.4} />}
      {children}
    </span>
  );
}
