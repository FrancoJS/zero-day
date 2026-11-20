import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, Lock, RotateCcw, Send, TriangleAlert } from "lucide-react";

const FOCO = "focus:outline-none focus-visible:ring-2 focus-visible:ring-muni-primary focus-visible:ring-offset-2";

function Burbuja({ mensaje }) {
  if (mensaje.rol === "yo") {
    return (
      <div className="max-w-[80%] self-end whitespace-pre-line rounded-2xl rounded-tr-xs bg-muni-primary-a11y px-3.5 py-2.5 text-sm text-white shadow-xs">
        {mensaje.contenido}
        <small className="mt-1 block text-right text-xs tabular-nums text-white/70">{mensaje.hora}</small>
      </div>
    );
  }
  if (mensaje.rol === "error") {
    return (
      <div role="alert" className="flex max-w-[80%] gap-2 self-start rounded-2xl rounded-tl-xs border border-critico-borde bg-critico-fondo px-3.5 py-2.5 text-sm text-critico shadow-xs">
        <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <b className="block font-semibold">No se pudo procesar tu mensaje</b>
          {mensaje.contenido}
          <small className="mt-1 block text-xs tabular-nums opacity-75">{mensaje.hora}</small>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-[80%] self-start rounded-2xl rounded-tl-xs border border-gray-200/90 bg-white px-3.5 py-2.5 text-sm text-gray-800 shadow-xs">
      {mensaje.contenido}
      {mensaje.pregunta && <b className="mt-1.5 block font-semibold text-gray-900">{mensaje.pregunta}</b>}
      {mensaje.hora && <small className="mt-1 block text-xs tabular-nums text-gray-400">{mensaje.hora}</small>}
    </div>
  );
}

function Escribiendo({ reducir }) {
  return (
    <div
      role="status"
      aria-label="El asistente está escribiendo"
      className="inline-flex gap-1.5 self-start rounded-xl rounded-tl-md border border-gray-200 bg-white px-4 py-3.5"
    >
      {[0, 1, 2].map((i) => (
        <motion.i
          key={i}
          className="h-2 w-2 rounded-full bg-gray-500"
          animate={reducir ? undefined : { opacity: [1, 0.35, 1] }}
          transition={reducir ? undefined : { duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

/**
 * Chat del asistente. Las respuestas rápidas (`chips`) son del último mensaje.
 * @param {{mensajes: any[], chips: {texto: string, alElegir: () => void, reintentar?: boolean}[],
 *   escribiendo: boolean, bloqueado: boolean, alEnviar: (texto: string) => void}} props
 */
export default function ChatAsistente({ mensajes, chips, escribiendo, bloqueado, alEnviar }) {
  const reducir = useReducedMotion();
  const [borrador, setBorrador] = useState("");
  const lista = useRef(null);

  useEffect(() => {
    const el = lista.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reducir ? "auto" : "smooth" });
  }, [mensajes, chips, escribiendo, reducir]);

  const enviar = () => {
    const texto = borrador.trim();
    if (!texto || bloqueado || escribiendo) return;
    alEnviar(texto);
    setBorrador("");
  };

  const entrada = reducir ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 } };

  return (
    <section aria-labelledby="t-chat" className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs">
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-4 py-2.5 sm:px-5 sm:py-3">
        <div aria-hidden="true" className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full border border-muni-primary/20 bg-muni-primary/10 text-muni-primary-a11y">
          <Bot aria-hidden="true" className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
        </div>
        <div>
          <b id="t-chat" className="block text-sm sm:text-base font-semibold leading-tight text-gray-900">Asistente de reportes</b>
          <span className="text-xs text-gray-500">Te ayuda a clasificar y coordinar el retiro en Rancagua</span>
        </div>
      </div>

      <div ref={lista} role="log" aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-gray-50/70 p-4 sm:p-5">
        <AnimatePresence initial={false}>
          {mensajes.map((m) => (
            <motion.div key={m.id} className="flex flex-col" {...entrada}>
              <Burbuja mensaje={m} />
            </motion.div>
          ))}
        </AnimatePresence>
        {!escribiendo && chips.length > 0 && (
          <motion.div aria-label="Respuestas rápidas" role="group" className="flex max-w-[85%] flex-wrap gap-1.5 self-start pt-1" {...entrada}>
            {chips.map((c) => (
              <button
                key={c.texto}
                type="button"
                onClick={c.alElegir}
                className={`inline-flex items-center gap-1.5 rounded-full border border-muni-primary/25 bg-white px-3 py-1 text-xs font-semibold text-muni-primary-a11y shadow-2xs hover:bg-muni-primary/10 ${FOCO}`}
              >
                {c.reintentar && <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />}
                {c.texto}
              </button>
            ))}
          </motion.div>
        )}
        {escribiendo && <Escribiendo reducir={reducir} />}
      </div>

      <form
        className="flex items-end gap-2 border-t border-gray-100 px-4 py-2.5 sm:px-5 sm:py-3"
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <label htmlFor="msg-vecino" className="sr-only">Escribe tu mensaje</label>
        <textarea
          id="msg-vecino"
          rows={1}
          value={borrador}
          disabled={bloqueado}
          onChange={(e) => setBorrador(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          placeholder={bloqueado ? "Reporte enviado" : mensajes.length > 1 ? "Escribe tu respuesta…" : "Ej.: Botaron escombros en la esquina de…"}
          className="h-10 sm:h-11 flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-muni-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-muni-primary/20 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={bloqueado || escribiendo || !borrador.trim()}
          className={`inline-flex h-10 sm:h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-muni-primary-a11y px-4 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors hover:bg-muni-primary-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 ${FOCO}`}
        >
          <Send aria-hidden="true" className="h-3.5 w-3.5" />
          <span>Enviar</span>
        </button>
      </form>
      <p className="flex items-center gap-1.5 px-4 pb-2.5 sm:px-5 sm:pb-3 text-xs text-gray-500">
        <Lock aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        No escribas RUT ni teléfono: se filtran automáticamente antes de guardar.
      </p>
    </section>
  );
}
