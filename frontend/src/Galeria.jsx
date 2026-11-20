// Galería del kit (/?galeria): cada componente con datos de ejemplo del caso de incidentes del diseño 05.
// Referencia para armar pantallas el día del desafío. Nada aquí llama a la IA ni al backend.
import { useState } from "react";
import Aviso from "./components/Aviso";
import Boton from "./components/Boton";
import Cargando from "./components/Cargando";
import ChipsEvidencia from "./components/ChipsEvidencia";
import Encabezado from "./components/Encabezado";
import EstadoVacio from "./components/EstadoVacio";
import FranjaEstado from "./components/FranjaEstado";
import { ListaHistorial } from "./components/Historial";
import Icono, { NOMBRES_ICONOS } from "./components/Iconos";
import { InsigniasModo } from "./components/IndicadorModo";
import Insignia from "./components/Insignia";
import ListaSenales from "./components/ListaSenales";
import MensajeError from "./components/MensajeError";
import PanelAprobacion from "./components/PanelAprobacion";
import { VistaCalidad } from "./components/PanelCalidad";
import RazonamientoEnVivo from "./components/RazonamientoEnVivo";
import RegistroAccion from "./components/RegistroAccion";
import Tarjeta from "./components/Tarjeta";
import TarjetasResultado from "./components/TarjetasResultado";
import TextoEvidencia from "./components/TextoEvidencia";

// ---------- Datos de ejemplo (caso Centinela, diseño 05) ----------

const SALUD_LIVE = { modo_ia: "live", modelo: "deepseek-v4.1-flash", base_datos: "conectada" };

const SENALES = [
  { id: "S2", fuente: "Log", texto: "“pool de conexiones agotado (50/50), timeout 30 s”", meta: "pagos-api · 312 repeticiones", hora: "09:02", estado: "evidencia" },
  { id: "S1", fuente: "Alerta", texto: "latencia p95 de /checkout sobre 8 s", meta: "Cloud Eye", hora: "09:01", estado: "evidencia" },
  { id: "S5", fuente: "Despliegue", texto: "v2.14.0 de pagos-api: pool máx. de 200 a 50", meta: "pipeline · 8 min antes del primer error", hora: "08:54", estado: "evidencia" },
  { id: "S3", fuente: "Ticket", texto: "“no puedo pagar, se queda cargando”", meta: "soporte · 17 similares", hora: "09:05", estado: "evidencia" },
  { id: "S4", fuente: "Chat", texto: "“¿alguien tocó pagos hoy? se cae el checkout”", meta: "#ops", hora: "09:06", estado: "relevante" },
  { id: "S6", fuente: "Alerta", texto: "disco al 81 % en backup-02", hora: "09:03", estado: "ruido", motivo: "alerta recurrente, sin relación con pagos" },
  { id: "S7", fuente: "Chat", texto: "“¿quién pide almuerzo hoy?”", hora: "09:04", estado: "ruido", motivo: "conversación no técnica" },
  { id: "S8", fuente: "Alerta", texto: "CPU 72 % en reportes-batch", hora: "08:58", estado: "ruido", etiqueta: "Falso positivo", motivo: "job nocturno programado" },
];

const CHIPS = [
  { id: "S2", texto: "pool agotado (50/50)" },
  { id: "S5", texto: "pool 200 → 50 en v2.14.0" },
  { id: "S1", texto: "p95 sobre 8 s" },
  { id: "S3", texto: "17 tickets de pago" },
];

const FICHA = [
  { etiqueta: "Afecta", valor: "pagos-api (3 instancias)" },
  { etiqueta: "Responsable", valor: "Turno de guardia SRE" },
  { etiqueta: "Reversa", valor: "volver a v2.14.0 en 1 paso" },
  { etiqueta: "Éxito si", valor: "p95 < 1 s en 10 min" },
];

const REGISTRO = [
  { titulo: "Propuesta por el agente", detalle: "revertir pagos-api a v2.13.2 · riesgo medio", hora: "09:12" },
  { titulo: "Aprobada por Camila Rojas", detalle: "turno de guardia SRE", hora: "09:14" },
  { titulo: "Reversa ejecutada", detalle: "3 instancias reiniciadas", hora: "09:15", simulado: true },
  { titulo: "Verificación: p95 0,8 s", detalle: "criterio de éxito: p95 < 1 s en 10 min", hora: "09:25", simulado: true },
];

const PASOS_RAZONAMIENTO = [
  { texto: <>Agrupé las 8 señales por servicio: <b>pagos-api</b> concentra 5.</>, estado: "hecho" },
  { texto: "Descarté 3 como ruido: alerta recurrente de disco, job nocturno y conversación no técnica.", estado: "hecho" },
  { texto: "Buscando un cambio reciente en pagos-api… encontré el despliegue v2.14.0 a las 08:54", estado: "en_curso" },
  { texto: "Proponer una acción con riesgo y reversa", estado: "pendiente" },
];

const TEXTO_RECLAMO =
  "Desde las 9:00 el checkout no funciona: el pago se queda cargando y después dice error. Ya van 17 clientes reclamando por teléfono. Necesitamos que lo revisen urgente.";

const RESPUESTA_ANALISIS = {
  resultado: {
    categoria: "incidente",
    prioridad: "alta",
    resumen: "El checkout falla desde las 9:00 y ya hay 17 clientes afectados.",
    accion_sugerida: "Escalar al turno de guardia de pagos y revisar el último despliegue de pagos-api.",
    evidencia: ["el checkout no funciona", "17 clientes reclamando", "urgente"],
  },
  modo: "live",
  modelo: "deepseek-v4.1-flash",
  intentos: 1,
  latencia_ms: 2900,
  uso: { tokens_entrada: 352, tokens_salida: 341, costo_clp_estimado: 0.34 },
  evidencia_descartada: 1,
  guardado: true,
};

const HISTORIAL = {
  bd: "conectada",
  registros: [
    { id: 3, creado_en: "2026-11-20T09:12:00", categoria: "incidente", prioridad: "alta", resumen: "El checkout falla desde las 9:00 y hay 17 clientes afectados." },
    { id: 2, creado_en: "2026-11-20T09:05:00", categoria: "reclamo", prioridad: "media", resumen: "Cliente reclama un cobro duplicado en su boleta de octubre." },
    { id: 1, creado_en: "2026-11-20T08:58:00", categoria: "consulta", prioridad: "baja", resumen: "Consulta por el horario de la sucursal de Rancagua." },
  ],
};

const EVALUACION = {
  disponible: true,
  fecha: "2026-11-20T13:50:00",
  modo: "live",
  modelo: "deepseek-v4.1-flash",
  total: 8,
  aciertos: 7,
  latencia_promedio_ms: 2900,
  tokens_entrada: 2818,
  tokens_salida: 2768,
  costo_clp_estimado: 2.74,
  por_tipo: {
    normal: { aciertos: 3, total: 3 },
    ambiguo: { aciertos: 1, total: 1 },
    inyeccion: { aciertos: 1, total: 1 },
    fuera_de_dominio: { aciertos: 0, total: 1 },
    datos_sensibles: { aciertos: 1, total: 1 },
    informal: { aciertos: 1, total: 1 },
  },
  casos: [{ id: "fuera-de-dominio", tipo: "fuera_de_dominio", ok: false, motivos: ["categoria: esperaba 'otro', obtuvo 'consulta'"] }],
};

const PALETA = [
  ["fondo", "#FAF9F7"], ["superficie", "#FFFFFF"], ["sutil", "#F3F2EF"], ["borde", "#E4E2DD"],
  ["texto", "#161618"], ["texto2", "#4A4A4F"], ["texto3", "#6B6B70"],
  ["acento", "#2952E3"], ["acento-osc", "#1E3FB8"], ["acento-suave", "#E8EDFD"],
  ["ok", "#15803D"], ["adv", "#92400E"], ["parcial", "#C2410C"], ["critico", "#B91C1C"],
];

// ---------- Galería ----------

export default function Galeria() {
  return (
    <div className="min-h-screen pb-16">
      <Encabezado className="px-6 lg:px-8" producto={<><b className="text-texto">Galería del kit</b> · datos de ejemplo, sin IA</>}>
        <InsigniasModo salud={SALUD_LIVE} />
      </Encabezado>
      <div className="px-6 pt-5 lg:px-8">
        <Aviso tono="info">
          Todo lo de esta página es <b>de ejemplo</b> (caso de incidentes del diseño 05) y no llama al backend. Código en{" "}
          <code className="font-semibold">frontend/src/Galeria.jsx</code>; componentes en{" "}
          <code className="font-semibold">frontend/src/components/</code>. La app real está en <a className="font-bold underline" href="/">/</a>.
        </Aviso>
      </div>

      <PantallaCompuesta />

      <div className="grid grid-cols-1 gap-6 px-6 lg:px-8 xl:grid-cols-2">
        <Seccion nombre="Paleta" archivo="tailwind.config.js" ancho>
          <div className="flex flex-wrap gap-3">
            {PALETA.map(([nombre, hex]) => (
              <div key={nombre} className="w-36 text-[14px] text-texto">
                <span className="mb-1 block h-10 rounded-lg border border-borde-fuerte" style={{ background: hex }} />
                <b>{nombre}</b> <span className="text-texto2">{hex}</span>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion nombre="Insignia" archivo="Insignia.jsx · IndicadorModo.jsx">
          <div className="flex flex-wrap gap-2.5">
            <Insignia tono="critico" icono="error">Crítico · checkout caído</Insignia>
            <Insignia tono="parcial">Afecta pagos con tarjeta</Insignia>
            <Insignia tono="adv" icono="alerta">Riesgo medio · reinicio de 2 min</Insignia>
            <Insignia tono="ok" icono="check">Resuelto</Insignia>
            <Insignia tono="acento" icono="documento">Categoría: incidente</Insignia>
            <Insignia tono="neutro">Sin clasificar</Insignia>
          </div>
          <p className="mt-4 mb-2 text-[15px] text-texto2">Forma pastilla (IndicadorModo / InsigniasModo):</p>
          <div className="flex flex-col gap-2.5">
            <InsigniasModo salud={SALUD_LIVE} />
            <InsigniasModo salud={{ modo_ia: "mock", modelo: "mock", base_datos: "desactivada" }} />
            <InsigniasModo salud={{ modo_ia: "live", modelo: "deepseek-v4.1-flash", base_datos: "error" }} />
            <div className="flex flex-wrap gap-2.5">
              <InsigniasModo salud={null} />
              <InsigniasModo error />
            </div>
          </div>
        </Seccion>

        <Seccion nombre="Botón" archivo="Boton.jsx">
          <div className="flex flex-wrap items-center gap-2.5">
            <Boton variante="primario" tamano="grande" icono="check">Aprobar y ejecutar</Boton>
            <Boton icono="editar">Editar</Boton>
            <Boton variante="peligro" icono="cruz">Rechazar</Boton>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <Boton variante="primario" disabled motivoDeshabilitado="Escribe un texto primero">
              Analizar
            </Boton>
            <Boton icono="reintentar">Reintentar</Boton>
          </div>
          <p className="mt-3 text-[15px] text-texto2">
            Deshabilitado: siempre con <code>motivoDeshabilitado</code> (tooltip + lector de pantalla). Un solo primario por pantalla.
          </p>
        </Seccion>

        <Seccion nombre="Franja de estado" archivo="FranjaEstado.jsx" ancho>
          <div className="flex flex-col gap-3 overflow-hidden rounded-xl border border-borde">
            <FranjaEstado
              className="px-5"
              ocupado
              mensaje="Analizando señales…"
              detalle="· la IA está buscando la causa raíz"
              pasos={[{ nombre: "Señales", estado: "hecho" }, { nombre: "Diagnóstico", estado: "actual" }, { nombre: "Aprobación", estado: "pendiente" }]}
            />
            <FranjaEstado
              className="px-5"
              tono="ok"
              mensaje="Acción aprobada"
              detalle="· por Camila Rojas (turno SRE) a las 09:14 · ejecución simulada en la demo"
              pasos={[{ nombre: "Señales", estado: "hecho" }, { nombre: "Diagnóstico", estado: "hecho" }, { nombre: "Aprobación", estado: "hecho" }]}
            />
            <FranjaEstado
              className="px-5"
              tono="error"
              mensaje="No se pudo completar el diagnóstico"
              detalle="· Kostra limitó las peticiones (429) · se reintentó 1 vez"
              pasos={[{ nombre: "Señales", estado: "hecho" }, { nombre: "Diagnóstico", estado: "error" }, { nombre: "Aprobación", estado: "pendiente" }]}
            />
          </div>
        </Seccion>

        <Seccion nombre="Lista resaltable (señales)" archivo="ListaSenales.jsx">
          <ListaSenalesDemo />
        </Seccion>

        <Seccion nombre="Razonamiento en vivo" archivo="RazonamientoEnVivo.jsx">
          <RazonamientoEnVivo segundos={3.1} pasos={PASOS_RAZONAMIENTO} etiqueta="La IA está buscando la causa raíz" />
          <p className="mt-5 mb-2 text-[15px] text-texto2">Pasado 20 s (aviso de espera larga):</p>
          <RazonamientoEnVivo segundos={24.6} texto="El despliegue v2.14.0 redujo el pool de conexiones" />
        </Seccion>

        <Seccion nombre="Evidencia: chips y texto" archivo="ChipsEvidencia.jsx · TextoEvidencia.jsx">
          <ChipsTextoDemo />
        </Seccion>

        <Seccion nombre="Panel de aprobación" archivo="PanelAprobacion.jsx">
          <PanelAprobacion
            accion="Revertir pagos-api a la versión v2.13.2"
            riesgo={{ tono: "adv", texto: "Riesgo medio · reinicio de 2 min" }}
            ficha={FICHA}
            onAprobar={() => {}}
            onEditar={() => {}}
            onRechazar={() => {}}
            simulado
          />
          <p className="mt-5 mb-2 text-[15px] text-texto2">Deshabilitado mientras no hay diagnóstico:</p>
          <PanelAprobacion accion="Se propondrá una acción cuando el diagnóstico esté listo." deshabilitado motivoDeshabilitado="Esperando diagnóstico" onAprobar={() => {}} />
        </Seccion>

        <Seccion nombre="Registro de la acción" archivo="RegistroAccion.jsx">
          <RegistroAccion items={REGISTRO} />
        </Seccion>

        <Seccion nombre="Aviso" archivo="Aviso.jsx">
          <div className="flex flex-col gap-3">
            <Aviso tono="info">El texto de las señales se trata como <b>datos, no como instrucciones</b>.</Aviso>
            <Aviso tono="adv">El ahorro de tiempo es un <b>estimado</b> a validar en el piloto.</Aviso>
            <Aviso tono="ok">4 de 4 evidencias verificadas en las señales.</Aviso>
            <Aviso tono="error" titulo="Kostra limitó las peticiones (429).">Espera unos segundos y reintenta.</Aviso>
          </div>
        </Seccion>

        <Seccion nombre="Estado vacío" archivo="EstadoVacio.jsx">
          <EstadoVacio mensaje="Aún no hay propuesta." detalle="Aparecerá aquí cuando el diagnóstico esté listo." />
          <EstadoVacio
            icono="documento"
            mensaje="¿No tienes un texto a mano?"
            ejemplos={["El sistema de pagos está caído desde las 9:00 y no podemos cobrar a nadie, es urgente."]}
            onEjemplo={() => {}}
          />
        </Seccion>

        <Seccion nombre="Carga y error" archivo="Cargando.jsx · MensajeError.jsx">
          <Cargando />
          <div className="mt-5">
            <MensajeError mensaje="Kostra limitó las peticiones (429). Espera unos segundos y reintenta." alReintentar={() => {}} />
          </div>
        </Seccion>

        <Seccion nombre="Resultado del análisis" archivo="TarjetasResultado.jsx · resultado de /api/ia/analizar">
          <TarjetasResultado respuesta={RESPUESTA_ANALISIS} textoAnalizado={TEXTO_RECLAMO} />
        </Seccion>

        <div>
          <p className="mb-2 font-mono text-[14px] text-texto2">Historial.jsx → ListaHistorial</p>
          <ListaHistorial datos={HISTORIAL} />
        </div>

        <Seccion nombre="Íconos" archivo="Iconos.jsx · <Icono nombre=… />">
          <div className="flex flex-wrap gap-4">
            {NOMBRES_ICONOS.map((nombre) => (
              <span key={nombre} className="flex w-24 flex-col items-center gap-1 text-[14px] text-texto2">
                <Icono nombre={nombre} className="h-7 w-7 text-texto" />
                {nombre}
              </span>
            ))}
          </div>
        </Seccion>

        <div className="xl:col-span-2">
          <p className="mb-2 font-mono text-[14px] text-texto2">PanelCalidad.jsx → VistaCalidad (estilo auditorio, solo corridas LIVE)</p>
          <VistaCalidad datos={EVALUACION} />
        </div>
      </div>
    </div>
  );
}

// Envoltorio de cada muestra: Tarjeta con el nombre del componente y su archivo.
function Seccion({ nombre, archivo, ancho, children }) {
  return (
    <Tarjeta titulo={nombre} subtitulo={<span className="font-mono text-[14px]">{archivo}</span>} className={ancho ? "xl:col-span-2" : ""}>
      {children}
    </Tarjeta>
  );
}

function ListaSenalesDemo() {
  const [activa, setActiva] = useState("S5");
  return (
    <ListaSenales
      items={SENALES.map((s) => (s.id === activa ? { ...s, estado: "activa" } : s))}
      onSeleccionar={(id) => setActiva(id)}
    />
  );
}

function ChipsTextoDemo() {
  const evidencia = RESPUESTA_ANALISIS.resultado.evidencia;
  const chips = evidencia.map((texto, i) => ({ id: `E${i + 1}`, texto }));
  const [activo, setActivo] = useState("E2");
  return (
    <div className="flex flex-col gap-4">
      <ChipsEvidencia chips={chips} activo={activo} onSeleccionar={setActivo} descartadas={1} />
      <TextoEvidencia texto={TEXTO_RECLAMO} evidencia={evidencia} fragmentoActivo={chips.find((c) => c.id === activo)?.texto} />
    </div>
  );
}

// Pantalla completa de 3 columnas (diseño 04) armada solo con el kit: así se arma una pantalla del desafío.
function PantallaCompuesta() {
  const [seleccion, setSeleccion] = useState("S2");
  const [estado, setEstado] = useState("pendiente"); // pendiente | aprobada | rechazada

  const senales = SENALES.map((s) => (s.id === seleccion && s.estado !== "ruido" ? { ...s, estado: "activa" } : s));
  const pasos = [
    { nombre: "Señales", estado: "hecho" },
    { nombre: "Diagnóstico", estado: "hecho" },
    { nombre: "Aprobación", estado: estado === "aprobada" ? "hecho" : "actual" },
  ];

  return (
    <section aria-label="Ejemplo de pantalla compuesta" className="my-6 border-y border-borde">
      <p className="bg-texto px-6 py-2 text-[15px] font-semibold text-white lg:px-8">
        Pantalla compuesta · diseño 04 armado con el kit (prueba: elige señales y chips, aprueba o rechaza)
      </p>
      {estado === "aprobada" ? (
        <FranjaEstado className="px-6 lg:px-8" tono="ok" mensaje="Acción aprobada" detalle="· por Camila Rojas (turno SRE) a las 09:14 · ejecución simulada en la demo" pasos={pasos} />
      ) : estado === "rechazada" ? (
        <FranjaEstado className="px-6 lg:px-8" mensaje="Propuesta rechazada" detalle="· no se ejecutó nada" pasos={pasos} />
      ) : (
        <FranjaEstado
          className="px-6 lg:px-8"
          mensaje="Diagnóstico listo"
          detalle="· 8 señales analizadas en 4,2 s · 3 descartadas como ruido · esperando tu aprobación"
          pasos={pasos}
        />
      )}
      <div className="grid grid-cols-1 items-start gap-5 bg-fondo px-6 py-5 lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,0.9fr)]">
        <Tarjeta titulo="Señales" subtitulo="5 relevantes · 3 ruido" relleno={false}>
          <ListaSenales items={senales} onSeleccionar={setSeleccion} />
        </Tarjeta>

        <Tarjeta titulo="Causa raíz probable">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2.5">
              <Insignia tono="critico" icono="error">Crítico · checkout caído</Insignia>
              <Insignia tono="parcial">Afecta pagos con tarjeta</Insignia>
            </div>
            <p className="text-[30px] font-bold leading-tight tracking-tight">
              El despliegue v2.14.0 redujo el pool de conexiones de pagos-api de 200 a 50, y con el tráfico de la mañana las
              conexiones se agotan.
            </p>
            <p className="text-[18px] leading-relaxed text-texto2">
              Confianza <b className="text-texto">alta</b>: el primer error aparece 8 minutos después del despliegue y los 4
              síntomas coinciden. <b className="text-texto">Falta confirmar</b> que no hubo un aumento anómalo de tráfico.
            </p>
            <ChipsEvidencia
              chips={CHIPS}
              activo={seleccion}
              onSeleccionar={setSeleccion}
              titulo="Evidencia citada · verificada en las señales"
              dondeSeVerifico="en las señales"
            />
          </div>
        </Tarjeta>

        <Tarjeta titulo={estado === "aprobada" ? "Registro de la acción" : "Acción propuesta"}>
          {estado === "aprobada" ? (
            <div className="flex flex-col gap-4">
              <RegistroAccion items={REGISTRO} />
              <Boton onClick={() => setEstado("pendiente")} className="self-start">
                Volver a la propuesta
              </Boton>
            </div>
          ) : estado === "rechazada" ? (
            <div className="flex flex-col gap-4">
              <EstadoVacio icono="candado" mensaje="Propuesta rechazada." detalle="Nada se ejecuta." />
              <Boton onClick={() => setEstado("pendiente")} className="self-start">
                Volver a la propuesta
              </Boton>
            </div>
          ) : (
            <PanelAprobacion
              accion="Revertir pagos-api a la versión v2.13.2"
              riesgo={{ tono: "adv", texto: "Riesgo medio · reinicio de 2 min" }}
              ficha={FICHA}
              onAprobar={() => setEstado("aprobada")}
              onEditar={() => {}}
              onRechazar={() => setEstado("rechazada")}
              simulado
            />
          )}
        </Tarjeta>
      </div>
    </section>
  );
}
