import Icono from "./Iconos";

/**
 * Evidencia citada por la IA como chips clicables (diseño 04). Al elegir un chip, el padre resalta
 * la señal o el fragmento correspondiente (ListaSenales con estado "activa", TextoEvidencia con fragmentoActivo).
 * @param {object} props
 * @param {{id: string, texto: string}[]} props.chips  solo evidencia YA verificada por el backend
 * @param {string} [props.activo]  id del chip seleccionado
 * @param {(id: string) => void} [props.onSeleccionar]
 * @param {number} [props.descartadas=0]  citas de la IA que no existían en el texto y se descartaron
 * @param {string} [props.titulo]  rótulo sobre los chips
 * @param {string} [props.dondeSeVerifico="en el texto"]  ej. "en las señales"
 */
export default function ChipsEvidencia({
  chips = [],
  activo,
  onSeleccionar,
  descartadas = 0,
  titulo = "Evidencia citada · verificada",
  dondeSeVerifico = "en el texto",
}) {
  const total = chips.length + descartadas;
  return (
    <div>
      {titulo && <p className="mb-2 text-[14px] font-bold uppercase tracking-[0.08em] text-texto2">{titulo}</p>}
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const esActivo = chip.id === activo;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={esActivo}
                onClick={() => onSeleccionar?.(chip.id)}
                className={`inline-flex max-w-full items-center gap-2 rounded-[22px] border-[1.5px] px-3.5 py-1.5 text-left text-base font-semibold transition-colors motion-reduce:transition-none ${
                  esActivo
                    ? "border-acento bg-acento text-white"
                    : "border-acento-borde bg-superficie text-acento-osc hover:bg-acento-suave"
                }`}
              >
                <b
                  className={`shrink-0 rounded-md px-1.5 text-[13px] ${
                    esActivo ? "bg-white text-acento-osc" : "bg-acento-suave"
                  }`}
                >
                  {chip.id}
                </b>
                <span className="min-w-0 break-words">{chip.texto}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-base text-texto2">La IA no citó evidencia.</p>
      )}
      <p className={`mt-2 flex items-center gap-1.5 text-[15px] font-medium ${descartadas > 0 ? "text-adv" : "text-ok"}`}>
        <Icono nombre={descartadas > 0 ? "alerta" : "check"} className="h-4 w-4" grosor={3} />
        {chips.length} de {total} evidencias verificadas {dondeSeVerifico} · {descartadas}{" "}
        {descartadas === 1 ? "descartada" : "descartadas"}
      </p>
    </div>
  );
}
