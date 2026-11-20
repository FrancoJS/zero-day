import { useState } from "react";
import ChipsEvidencia from "./ChipsEvidencia";
import Insignia from "./Insignia";
import TextoEvidencia from "./TextoEvidencia";
import { insigniaPrioridad } from "./prioridad";

const numero = (valor, opciones) => valor.toLocaleString("es-CL", opciones);

// Montos chicos (fracciones de peso o de dólar) con 2 cifras significativas; los grandes, redondeados.
function montoEstimado(valor, decimales) {
  return valor < 1 ? numero(valor, { maximumSignificantDigits: 2 }) : numero(valor, { maximumFractionDigits: decimales });
}

// Pesos: bajo $10 con 2 decimales ("0,39"); bajo un centavo, 2 cifras significativas; desde $10, sin decimales.
export function montoClp(valor) {
  if (valor > 0 && valor < 0.01) return numero(valor, { maximumSignificantDigits: 2 });
  if (valor < 10) return numero(valor, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return numero(valor, { maximumFractionDigits: 0 });
}

// Tokens y costo. El costo siempre lleva "estimado": sale de precios configurados a mano en .env.
function textoUso(modo, uso) {
  if (modo === "mock") return "tokens no disponibles en MOCK";
  if (uso?.tokens_entrada == null || uso?.tokens_salida == null) return "tokens no informados por Kostra";
  let texto = `${numero(uso.tokens_entrada + uso.tokens_salida)} tokens (entrada ${numero(uso.tokens_entrada)} · salida ${numero(uso.tokens_salida)})`;
  if (uso.costo_clp_estimado != null) texto += ` · ≈ $${montoClp(uso.costo_clp_estimado)} CLP (estimado)`;
  else if (uso.costo_usd_estimado != null) texto += ` · ≈ US$${montoEstimado(uso.costo_usd_estimado, 2)} (estimado)`;
  return texto;
}

/**
 * Resultado de /api/ia/analizar: categoría y prioridad (Insignias), resumen, acción sugerida, evidencia
 * (chips + texto resaltado) y una línea con modelo, tiempo, tokens y costo estimado. Va dentro de una Tarjeta.
 * ← Adaptar al desafío junto con esquemas.py.
 * @param {object} props
 * @param {object} props.respuesta  RespuestaAnalisis del backend
 * @param {string} [props.textoAnalizado]  texto enviado (para resaltar la evidencia)
 */
export default function TarjetasResultado({ respuesta, textoAnalizado }) {
  const { resultado, modo, modelo, intentos, latencia_ms, uso, evidencia_descartada } = respuesta;
  const evidencia = resultado.evidencia || [];
  const chips = evidencia.map((texto, i) => ({ id: `E${i + 1}`, texto }));
  const [activo, setActivo] = useState(null);
  const prioridad = insigniaPrioridad(resultado.prioridad);
  const fragmentoActivo = chips.find((chip) => chip.id === activo)?.texto;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2.5">
        <Insignia tono={prioridad.tono} icono={prioridad.icono}>
          {prioridad.texto}
        </Insignia>
        <Insignia tono="acento" icono="documento">
          Categoría: {resultado.categoria}
        </Insignia>
      </div>

      <p className="text-[28px] font-bold leading-tight tracking-tight text-texto">{resultado.resumen}</p>

      <div>
        <p className="mb-1.5 text-[14px] font-bold uppercase tracking-[0.08em] text-texto2">Acción sugerida</p>
        <p className="rounded-xl border-l-4 border-acento bg-acento-tenue px-4 py-3 text-[19px] leading-snug text-texto">
          {resultado.accion_sugerida}
        </p>
      </div>

      <ChipsEvidencia
        chips={chips}
        activo={activo}
        onSeleccionar={(id) => setActivo((previo) => (previo === id ? null : id))}
        descartadas={evidencia_descartada || 0}
      />

      {textoAnalizado && (
        <TextoEvidencia
          texto={textoAnalizado}
          evidencia={evidencia}
          descartada={0}
          fragmentoActivo={fragmentoActivo}
        />
      )}

      <p className="text-[15px] leading-snug text-texto3">
        {modo === "live" ? `Kostra · ${modelo}` : "MOCK"} ·{" "}
        {numero(latencia_ms / 1000, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s
        {intentos > 1 ? ` · ${intentos} intentos (el primer JSON vino mal)` : ""} · {textoUso(modo, uso)}
      </p>
    </div>
  );
}
