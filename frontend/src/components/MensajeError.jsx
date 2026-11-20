import Aviso from "./Aviso";
import Boton from "./Boton";

/**
 * Error claro y con salida: dice qué pasó y ofrece reintentar. Nunca se reemplaza por un resultado inventado.
 * @param {object} props
 * @param {string} props.mensaje  mensaje del backend ({codigo, mensaje} → mensaje)
 * @param {() => void} [props.alReintentar]  si se pasa, muestra el botón Reintentar
 * @param {string} [props.titulo="No se pudo completar"]
 */
export default function MensajeError({ mensaje, alReintentar, titulo = "No se pudo completar" }) {
  return (
    <div className="flex flex-col gap-4">
      <Aviso tono="error" role="alert" titulo={titulo}>
        <p>{mensaje}</p>
      </Aviso>
      <p className="text-[17px] leading-snug text-texto2">
        <b className="text-texto">No mostramos un resultado inventado.</b> Si la IA no responde, la app lo dice en vez de
        cambiar a respuestas simuladas sin avisar.
      </p>
      {alReintentar && (
        <Boton variante="primario" icono="reintentar" onClick={alReintentar} className="self-start">
          Reintentar
        </Boton>
      )}
    </div>
  );
}
