import { useState } from "react";
import ChipsEvidencia from "./ChipsEvidencia";
import Insignia from "./Insignia";
import TextoEvidencia from "./TextoEvidencia";
import { insigniaPrioridad } from "./prioridad";

const numero = (valor, opciones) => valor.toLocaleString("es-CL", opciones);

function montoEstimado(valor, decimales) {
  return valor < 1 ? numero(valor, { maximumSignificantDigits: 2 }) : numero(valor, { maximumFractionDigits: decimales });
}

export function montoClp(valor) {
  if (valor > 0 && valor < 0.01) return numero(valor, { maximumSignificantDigits: 2 });
  if (valor < 10) return numero(valor, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return numero(valor, { maximumFractionDigits: 0 });
}

function textoUso(modo, uso) {
  if (modo === "mock") return "tokens no disponibles en MOCK";
  if (uso?.tokens_entrada == null || uso?.tokens_salida == null) return "tokens no informados por Kostra";
  let texto = `${numero(uso.tokens_entrada + uso.tokens_salida)} tokens (entrada ${numero(uso.tokens_entrada)} · salida ${numero(uso.tokens_salida)})`;
  if (uso.costo_clp_estimado != null) texto += ` · ≈ $${montoClp(uso.costo_clp_estimado)} CLP (estimado)`;
  else if (uso.costo_usd_estimado != null) texto += ` · ≈ US$${montoEstimado(uso.costo_usd_estimado, 2)} (estimado)`;
  return texto;
}

const ETIQUETA_ACCION = {
  cuadrilla_estandar: "Despachar cuadrilla estándar de aseo",
  camion_tolva: "Despachar camión tolva / maquinaria pesada",
  retiro_especializado: "Coordinar retiro especializado (residuo peligroso)",
  fiscalizacion: "Enviar inspectores municipales (fiscalización)",
  derivar: "Derivar a otra unidad municipal (no es residuo)",
  pedir_mas_datos: "Solicitar más antecedentes al vecino antes de despachar",
};

/**
 * Resultado de /api/ia/analizar con el sistema de diseño municipal (DESING.md §2, §3, §5.2).
 * Soporta tanto el esquema de microbasurales (`tipo_residuo`, `peligrosidad`, `falta_informacion`)
 * como el esquema de ejemplo de la galería (`categoria`).
 */
export default function TarjetasResultado({ respuesta, textoAnalizado }) {
  const { resultado, modo, modelo, intentos, latencia_ms, uso, evidencia_descartada } = respuesta;
  const evidencia = resultado.evidencia || [];
  const faltantes = resultado.falta_informacion || [];
  const chips = evidencia.map((texto, i) => ({ id: `E${i + 1}`, texto }));
  const [activo, setActivo] = useState(null);
  const prioridad = insigniaPrioridad(resultado.prioridad);
  const fragmentoActivo = chips.find((chip) => chip.id === activo)?.texto;
  const accionTexto = ETIQUETA_ACCION[resultado.accion_sugerida] || resultado.accion_sugerida;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Insignia tono={prioridad.tono} icono={prioridad.icono}>
          {prioridad.texto}
        </Insignia>
        <Insignia tono="vino" icono="documento">
          {resultado.tipo_residuo ? `Residuo: ${resultado.tipo_residuo}` : `Categoría: ${resultado.categoria}`}
        </Insignia>
        {resultado.peligrosidad && (
          <Insignia
            tono={resultado.peligrosidad === "alta" ? "critico" : resultado.peligrosidad === "media" ? "adv" : "neutro"}
          >
            Peligrosidad {resultado.peligrosidad}
          </Insignia>
        )}
      </div>

      <p className="text-lg sm:text-xl font-bold leading-snug tracking-tight text-gray-900 dark:text-white">
        {resultado.resumen}
      </p>

      <div>
        <p className="mb-1.5 text-2xs font-bold uppercase tracking-wider text-[#8C1D28]/85 dark:text-rose-300/80">
          Acción municipal sugerida
        </p>
        <p className="rounded-xl border border-rose-200/90 border-l-4 border-l-muni-primary bg-rose-50/40 px-4 py-3 text-sm sm:text-base font-semibold leading-snug text-gray-900 dark:border-rose-900/60 dark:border-l-rose-400 dark:bg-rose-950/25 dark:text-gray-100">
          {accionTexto}
        </p>
      </div>

      {faltantes.length > 0 && (
        <div className="destacado">
          <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
            Falta confirmar en terreno / con el vecino
          </p>
          <ul className="list-disc pl-4 text-xs sm:text-sm space-y-0.5">
            {faltantes.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

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

      <p className="border-t border-gray-100 pt-2.5 text-xs leading-snug text-gray-500 tabular-nums dark:border-gray-800 dark:text-gray-400">
        {modo === "live" ? `Kostra · ${modelo}` : "MOCK"} ·{" "}
        {numero(latencia_ms / 1000, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s
        {intentos > 1 ? ` · ${intentos} intentos (el primer JSON vino mal)` : ""} · {textoUso(modo, uso)}
      </p>
    </div>
  );
}
