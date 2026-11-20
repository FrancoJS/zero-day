import Icono from "./Iconos";

/**
 * Estado vacío: qué falta y cómo empezar. Con ejemplos, cada uno es un botón que llama onEjemplo(texto).
 * @param {object} props
 * @param {string} [props.icono="vacio"]  nombre de ícono de Iconos.jsx
 * @param {React.ReactNode} props.mensaje  ej. "Aún no hay propuesta."
 * @param {React.ReactNode} [props.detalle]  ej. "Aparecerá aquí cuando el diagnóstico esté listo."
 * @param {string[]} [props.ejemplos]  textos de ejemplo para probar con un clic
 * @param {(texto: string) => void} [props.onEjemplo]
 * @param {string} [props.tituloEjemplos="Prueba con un ejemplo"]
 */
export default function EstadoVacio({ icono = "vacio", mensaje, detalle, ejemplos = [], onEjemplo, tituloEjemplos = "Prueba con un ejemplo" }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <Icono nombre={icono} className="h-14 w-14 text-texto3" grosor={1.6} />
      <p className="text-[18px] font-semibold text-texto">{mensaje}</p>
      {detalle && <p className="max-w-md text-[17px] leading-snug text-texto2">{detalle}</p>}
      {ejemplos.length > 0 && (
        <div className="mt-2 flex w-full flex-col gap-2 text-left">
          <p className="text-[14px] font-bold uppercase tracking-[0.08em] text-texto2">{tituloEjemplos}</p>
          {ejemplos.map((ejemplo) => (
            <button
              key={ejemplo}
              type="button"
              onClick={() => onEjemplo?.(ejemplo)}
              className="rounded-xl border border-borde bg-superficie px-4 py-2.5 text-left text-base leading-snug text-texto transition-colors hover:border-acento-borde hover:bg-acento-tenue motion-reduce:transition-none"
            >
              {ejemplo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
