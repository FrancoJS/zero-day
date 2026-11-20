// Texto analizado con la evidencia resaltada. El backend ya verificó que cada fragmento existe en el texto;
// aquí se ubica igual que allá: sin distinguir mayúsculas y con cualquier cantidad de espacios.

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const normalizar = (texto = "") => texto.trim().toLowerCase().replace(/\s+/g, " ");

function partirConEvidencia(texto, evidencia) {
  const patrones = [...evidencia]
    .sort((a, b) => b.length - a.length) // primero los más largos
    .map((f) => escaparRegex(f.trim()).replace(/\s+/g, "\\s+"))
    .filter(Boolean);
  if (!patrones.length) return [{ texto, resaltado: false }];
  const regex = new RegExp(`(${patrones.join("|")})`, "giu");
  // split con grupo de captura: las posiciones impares son coincidencias
  return texto
    .split(regex)
    .map((parte, i) => ({ texto: parte, resaltado: i % 2 === 1 }))
    .filter((parte) => parte.texto);
}

/**
 * Texto original con la evidencia verificada resaltada (subrayado + fondo, y "[evidencia]" para lectores de pantalla).
 * @param {object} props
 * @param {string} props.texto  el texto que se envió a la IA
 * @param {string[]} [props.evidencia]  fragmentos verificados por el backend
 * @param {number} [props.descartada=0]  fragmentos citados que no existían (los descartó el backend)
 * @param {string} [props.fragmentoActivo]  fragmento a destacar más fuerte (el chip elegido en ChipsEvidencia)
 * @param {string} [props.titulo="Texto analizado · evidencia resaltada"]
 */
export default function TextoEvidencia({
  texto,
  evidencia = [],
  descartada = 0,
  fragmentoActivo,
  titulo = "Texto analizado · evidencia resaltada",
}) {
  const partes = partirConEvidencia(texto, evidencia);
  const activo = fragmentoActivo ? normalizar(fragmentoActivo) : null;
  return (
    <div className="rounded-xl bg-sutil px-4 py-3.5">
      {titulo && <p className="mb-1.5 text-[14px] font-bold uppercase tracking-[0.08em] text-texto2">{titulo}</p>}
      <p className="whitespace-pre-wrap text-[18px] leading-relaxed text-texto">
        {partes.map((parte, i) => {
          if (!parte.resaltado) return <span key={i}>{parte.texto}</span>;
          const esActivo = activo && normalizar(parte.texto) === activo;
          return (
            <mark
              key={i}
              className={`rounded px-0.5 underline decoration-2 underline-offset-4 ${
                esActivo ? "bg-acento text-white decoration-white" : "bg-acento-suave text-acento-osc decoration-acento"
              }`}
            >
              <span className="sr-only">[evidencia] </span>
              {parte.texto}
            </mark>
          );
        })}
      </p>
      {evidencia.length === 0 && <p className="mt-2 text-[15px] text-texto2">La IA no citó fragmentos del texto.</p>}
      {descartada > 0 && (
        <p className="mt-2 text-[15px] font-medium text-adv">
          {descartada} fragmento(s) citado(s) por la IA no aparecían en el texto y se descartaron.
        </p>
      )}
    </div>
  );
}
