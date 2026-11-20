import Aviso from "./Aviso";

/** Mensaje único cuando la IA pasa de 20 s (lo usan Cargando y RazonamientoEnVivo). */
export default function AvisoEsperaLarga({ className = "" }) {
  return (
    <Aviso tono="adv" icono="reloj" className={className}>
      <b>La IA está tardando más de lo normal.</b> Puede demorar hasta 90 s; si se pasa, verás un error con la opción de
      reintentar.
    </Aviso>
  );
}
