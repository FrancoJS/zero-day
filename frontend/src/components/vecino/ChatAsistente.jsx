import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, Lock, RotateCcw, Send, TriangleAlert } from "lucide-react";

const FOCO = "focus:outline-none focus-visible:ring-2 focus-visible:ring-muni-primary focus-visible:ring-offset-2";

function Burbuja({ mensaje }) {
  if (mensaje.rol === "yo") {
    return (
      <div className="max-w-[78%] self-end whitespace-pre-line rounded-xl rounded-tr-md bg-muni-primary-a11y px-4 py-3 text-base text-white">
        {mensaje.contenido}
        <small className="mt-1.5 block text-sm tabular-nums opacity-75">{mensaje.hora}</small>
      </div>
    );
  }
  if (mensaje.rol === "error") {
    return (
      <div role="alert" className="flex max-w-[78%] gap-2 self-start rounded-xl rounded-tl-md border border-critico-borde bg-critico-fondo px-4 py-3 text-base text-critico">
        <TriangleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <b className="block">No pude procesar tu mensaje</b>
          {mensaje.contenido}
          <small className="mt-1.5 block text-sm tabular-nums opacity-75">{mensaje.hora}</small>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-[78%] self-start rounded-xl rounded-tl-md border border-gray-200 bg-white px-4 py-3 text-base text-gray-900">
      {mensaje.contenido}
      {mensaje.pregunta && <b className="mt-2 block font-semibold">{mensaje.pregunta}</b>}
      {mensaje.hora && <small className="mt-1.5 block text-sm tabular-nums text-gray-500">{mensaje.hora}</small>}
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
    <section aria-labelledby="t-chat" className="flex min-h-0 flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-3.5">
        <div aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-muni-primary-200 bg-muni-primary-50 text-muni-primary-a11y">
          <Bot aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <b id="t-chat" className="block text-base">Asistente de reportes</b>
          <span className="text-sm text-gray-600">Te ayuda a reportar un microbasural en Rancagua</span>
        </div>
      </div>

      <div ref={lista} role="log" aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-auto bg-gray-50 p-5">
        <AnimatePresence initial={false}>
          {mensajes.map((m) => (
            <motion.div key={m.id} className="flex flex-col" {...entrada}>
              <Burbuja mensaje={m} />
            </motion.div>
          ))}
        </AnimatePresence>
        {!escribiendo && chips.length > 0 && (
          <motion.div aria-label="Respuestas rápidas" role="group" className="flex max-w-[78%] flex-wrap gap-2 self-start" {...entrada}>
            {chips.map((c) => (
              <button
                key={c.texto}
                type="button"
                onClick={c.alElegir}
                className={`inline-flex items-center gap-1.5 rounded-full border border-muni-primary-200 bg-white px-3.5 py-1.5 text-[15px] font-semibold text-muni-primary-a11y hover:bg-muni-primary-50 ${FOCO}`}
              >
                {c.reintentar && <RotateCcw aria-hidden="true" className="h-4 w-4" />}
                {c.texto}
              </button>
            ))}
          </motion.div>
        )}
        {escribiendo && <Escribiendo reducir={reducir} />}
      </div>

      <form
        className="flex items-end gap-2.5 border-t border-gray-200 px-5 py-3.5"
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
          className="h-12 flex-1 resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 placeholder-gray-500 focus:border-muni-primary focus:outline-none focus:ring-2 focus:ring-muni-primary/20 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={bloqueado || escribiendo || !borrador.trim()}
          className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-muni-primary-a11y px-5 text-base font-semibold text-white hover:bg-muni-primary-700 disabled:cursor-not-allowed disabled:opacity-60 ${FOCO}`}
        >
          <Send aria-hidden="true" className="h-5 w-5" />
          Enviar
        </button>
      </form>
      <p className="flex items-center gap-2 px-5 pb-3.5 text-sm text-gray-600">
        <Lock aria-hidden="true" className="h-4 w-4 shrink-0" />
        No escribas tu RUT ni tu teléfono: si los pones, se ocultan antes de guardar.
      </p>
    </section>
  );
}
