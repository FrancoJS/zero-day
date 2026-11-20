import Aviso from "./Aviso";
import Boton from "./Boton";

/**
 * Fallback de error de sección (DESING.md §2.4.3): contenedor `rose-*` / `.restriccion`
 * con opción explícita de reintentar y sin failover silencioso.
 */
export default function MensajeError({ mensaje, alReintentar, titulo = "No se pudo completar" }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-rose-200/90 bg-rose-50/40 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
      <Aviso tono="error" role="alert" titulo={titulo}>
        <p>{mensaje}</p>
      </Aviso>
      <p className="text-xs sm:text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        <b className="font-semibold text-gray-900 dark:text-white">No mostramos un resultado inventado.</b> Si la IA no
        responde, la aplicación lo informa en lugar de cambiar a respuestas simuladas en silencio.
      </p>
      {alReintentar && (
        <Boton variante="primario" icono="reintentar" onClick={alReintentar} className="self-start">
          Reintentar
        </Boton>
      )}
    </div>
  );
}
