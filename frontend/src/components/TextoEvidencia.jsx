// Texto analizado con la evidencia resaltada sobre superficie cálida (DESING.md §2.1 y §2.2).

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const normalizar = (texto = "") => texto.trim().toLowerCase().replace(/\s+/g, " ");

function partirConEvidencia(texto, evidencia) {
  const patrones = [...evidencia]
    .sort((a, b) => b.length - a.length)
    .map((f) => escaparRegex(f.trim()).replace(/\s+/g, "\\s+"))
    .filter(Boolean);
  if (!patrones.length) return [{ texto, resaltado: false }];
  const regex = new RegExp(`(${patrones.join("|")})`, "giu");
  return texto
    .split(regex)
    .map((parte, i) => ({ texto: parte, resaltado: i % 2 === 1 }))
    .filter((parte) => parte.texto);
}

/**
 * Texto original con la evidencia verificada resaltada usando el token `destacado` (#fff1d2)
 * o `muni-primary-a11y` cuando el chip está activo.
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
    <div className="rounded-xl border border-rose-200/80 bg-rose-50/25 p-4 dark:border-rose-900/40 dark:bg-gray-800/40">
      {titulo && (
        <p className="mb-1.5 text-2xs font-bold uppercase tracking-wider text-[#8C1D28]/85 dark:text-rose-300/80">
          {titulo}
        </p>
      )}
      <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-gray-800 dark:text-gray-200">
        {partes.map((parte, i) => {
          if (!parte.resaltado) return <span key={i}>{parte.texto}</span>;
          const esActivo = activo && normalizar(parte.texto) === activo;
          return (
            <mark
              key={i}
              className={`rounded px-1 py-0.5 font-semibold underline decoration-2 underline-offset-4 transition-colors ${
                esActivo
                  ? "bg-muni-primary-a11y text-white decoration-white shadow-xs"
                  : "bg-destacado text-[#6b151e] decoration-[#8C1D28] dark:bg-rose-950/80 dark:text-rose-200 dark:decoration-rose-400"
              }`}
            >
              <span className="sr-only">[evidencia] </span>
              {parte.texto}
            </mark>
          );
        })}
      </p>
      {evidencia.length === 0 && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">La IA no citó fragmentos del texto.</p>
      )}
      {descartada > 0 && (
        <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
          {descartada} fragmento(s) citado(s) por la IA no aparecían en el texto y se descartaron.
        </p>
      )}
    </div>
  );
}
