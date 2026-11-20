// Galería del kit (/?galeria): cada componente con el Sistema de Diseño Municipal de Rancagua (DESING.md).
// Nada aquí llama a la IA ni al backend.
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

const SALUD_LIVE = { modo_ia: "live", modelo: "deepseek-v4.1-flash", base_datos: "conectada" };

const SENALES = [
  { id: "S2", fuente: "Vecino", texto: "“dejaron colchones viejos y bolsas rotas frente a la plaza”", meta: "República de Chile · 3 avisos hoy", hora: "09:02", estado: "evidencia" },
  { id: "S1", fuente: "Inspector", texto: "microbasural obstruye vereda peatonal", meta: "Sector Norte", hora: "09:01", estado: "evidencia" },
  { id: "S5", fuente: "Vecino", texto: "“hay olor fuerte y perros rompiendo las bolsas”", meta: "mismo punto · hace 20 min", hora: "08:54", estado: "evidencia" },
  { id: "S3", fuente: "Ticket", texto: "“sigue acumulándose basura en la esquina”", meta: "OIRS · 4 similares", hora: "09:05", estado: "evidencia" },
  { id: "S4", fuente: "Chat", texto: "“¿pasó el camión recolector hoy por República?”", meta: "JJVV", hora: "09:06", estado: "relevante" },
  { id: "S6", fuente: "Alerta", texto: "luminaria apagada en pasaje 4", hora: "09:03", estado: "ruido", motivo: "fuera de dominio (alumbrado eléctrico)" },
  { id: "S7", fuente: "Chat", texto: "“¿a qué hora abre el gimnasio municipal?”", hora: "09:04", estado: "ruido", motivo: "consulta deportiva sin relación con residuos" },
  { id: "S8", fuente: "Alerta", texto: "bache en calzada", hora: "08:58", estado: "ruido", etiqueta: "Derivar", motivo: "corresponde a Dirección de Obras" },
];

const CHIPS = [
  { id: "S2", texto: "colchones viejos y bolsas rotas" },
  { id: "S1", texto: "obstruye vereda peatonal" },
  { id: "S5", texto: "perros rompiendo las bolsas" },
  { id: "S3", texto: "4 avisos similares en el sector" },
];

const FICHA = [
  { etiqueta: "Sector", valor: "República de Chile (4 reportes agrupados)" },
  { etiqueta: "Recurso", valor: "Camión tolva + cuadrilla estándar" },
  { etiqueta: "Unidad", valor: "Depto. Gestión de Calidad · Aseo y Ornato" },
  { etiqueta: "Verificación", valor: "Despeje de vereda y retiro de voluminosos" },
];

const REGISTRO = [
  { titulo: "Propuesta por el agente", detalle: "despachar camión tolva a República de Chile · prioridad alta", hora: "09:12" },
  { titulo: "Aprobada por Encargado Gestión de Calidad", detalle: "Municipalidad de Rancagua", hora: "09:14" },
  { titulo: "Orden de despacho registrada", detalle: "cuadrilla asignada al sector", hora: "09:15", simulado: true },
  { titulo: "Cierre de puntos agrupados", detalle: "4 reportes vecinales vinculados", hora: "09:25", simulado: true },
];

const PASOS_RAZONAMIENTO = [
  { texto: <>Agrupé los reportes por sector: <b>República de Chile</b> concentra 4 avisos.</>, estado: "hecho" },
  { texto: "Descarté 3 avisos fuera de dominio (luminaria, consulta deportiva y bache).", estado: "hecho" },
  { texto: "Verificando evidencia literal citada en los reportes vecinales…", estado: "en_curso" },
  { texto: "Proponer recurso municipal para aprobación del encargado", estado: "pendiente" },
];

const TEXTO_RECLAMO =
  "En la esquina de República de Chile con Recreo dejaron colchones viejos, bolsas de basura rotas y olor insoportable frente a la plaza. Hay perros rompiendo las bolsas y no se puede pasar por la vereda.";

const RESPUESTA_ANALISIS = {
  resultado: {
    tipo_residuo: "mixto",
    peligrosidad: "media",
    prioridad: "alta",
    resumen: "Acumulación de voluminosos (colchones) y basura domiciliaria dispersa que obstruye la vereda frente a la plaza.",
    accion_sugerida: "camion_tolva",
    falta_informacion: ["Confirmar número exacto o referencia frente a la plaza"],
    evidencia: ["colchones viejos", "bolsas de basura rotas", "no se puede pasar por la vereda"],
  },
  modo: "live",
  modelo: "deepseek-v4.1-flash",
  intentos: 1,
  latencia_ms: 2900,
  uso: { tokens_entrada: 352, tokens_salida: 341, costo_clp_estimado: 0.34 },
  evidencia_descartada: 0,
  guardado: true,
};

const HISTORIAL = {
  bd: "conectada",
  registros: [
    { id: 3, creado_en: "2026-11-20T09:12:00", tipo_residuo: "mixto", prioridad: "alta", resumen: "Colchones viejos y basura dispersa frente a la plaza en República de Chile." },
    { id: 2, creado_en: "2026-11-20T09:05:00", tipo_residuo: "escombros", prioridad: "media", resumen: "Restos de construcción y cerámica en bandejón de Población Dintrans." },
    { id: 1, creado_en: "2026-11-20T08:58:00", tipo_residuo: "no_es_residuo", prioridad: "baja", resumen: "Aviso por luminaria apagada en pasaje (derivar a alumbrado)." },
  ],
};

const EVALUACION = {
  disponible: true,
  fecha: "2026-11-20T13:50:00",
  modo: "live",
  modelo: "deepseek-v4.1-flash",
  total: 8,
  aciertos: 8,
  latencia_promedio_ms: 2900,
  tokens_entrada: 2818,
  tokens_salida: 2768,
  costo_clp_estimado: 2.74,
  por_tipo: {
    normal: { aciertos: 3, total: 3 },
    ambiguo: { aciertos: 1, total: 1 },
    inyeccion: { aciertos: 1, total: 1 },
    fuera_de_dominio: { aciertos: 1, total: 1 },
    datos_sensibles: { aciertos: 1, total: 1 },
    informal: { aciertos: 1, total: 1 },
  },
  casos: [],
};

// Dos capas cromáticas de DESING.md §2: muni-primary-* + sub-paleta Borgoña/Vino (#8C1D28 + rose-*) + semánticos
const PALETA = [
  ["muni-primary", "#C30101"],
  ["muni-primary-a11y", "#AE0101"],
  ["muni-primary-700", "#D90000"],
  ["muni-primary-900", "#930909"],
  ["vino (#8C1D28)", "#8C1D28"],
  ["vino-osc (#6B151E)", "#6B151E"],
  ["rose-50", "#FFF1F2"],
  ["rose-200", "#FECDD3"],
  ["destacado", "#FFF1D2"],
  ["gray-50 (fondo)", "#F9FAFB"],
  ["gray-900 (texto)", "#111827"],
  ["emerald-700 (ok)", "#047857"],
  ["amber-800 (adv)", "#92400E"],
  ["red-800 (crítico)", "#991B1B"],
];

export default function Galeria() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Encabezado
        className="px-4 sm:px-6 lg:px-8"
        producto={
          <>
            <b>Galería del Sistema de Diseño Municipal</b> · DESING.md
          </>
        }
      >
        <InsigniasModo salud={SALUD_LIVE} />
      </Encabezado>
      <div className="px-4 pt-5 sm:px-6 lg:px-8">
        <Aviso tono="info">
          Esta galería exhibe el kit de componentes actualizado con las reglas de <b>DESING.md</b> (dos capas cromáticas:
          rojo institucional <code>muni-primary</code> + sub-paleta Borgoña/Vino <code>#8C1D28</code> / <code>rose-*</code>).
          La aplicación real está en{" "}
          <a className="font-bold underline" href="/">
            /
          </a>
          .
        </Aviso>
      </div>

      <PantallaCompuesta />

      <div className="grid grid-cols-1 gap-5 px-4 sm:px-6 lg:px-8 xl:grid-cols-2">
        <Seccion nombre="Paleta Institucional (2 capas cromáticas)" archivo="DESING.md §2 · tailwind.config.js" ancho>
          <div className="flex flex-wrap gap-3">
            {PALETA.map(([nombre, hex]) => (
              <div key={nombre} className="w-36 text-xs text-gray-900 dark:text-gray-100">
                <span className="mb-1 block h-10 rounded-lg border border-gray-300 shadow-xs" style={{ background: hex }} />
                <b className="block truncate">{nombre}</b> <span className="font-mono text-gray-500">{hex}</span>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion nombre="Insignia" archivo="Insignia.jsx · IndicadorModo.jsx">
          <div className="flex flex-wrap gap-2">
            <Insignia tono="critico" icono="error">Prioridad alta</Insignia>
            <Insignia tono="parcial">Peligrosidad media</Insignia>
            <Insignia tono="adv" icono="alerta">Falta ubicación exacta</Insignia>
            <Insignia tono="ok" icono="check">Despacho aprobado</Insignia>
            <Insignia tono="vino" icono="documento">Residuo: mixto</Insignia>
            <Insignia tono="acento" icono="chispa">Sector: República de Chile</Insignia>
            <Insignia tono="neutro">Sin clasificar</Insignia>
          </div>
          <p className="mt-4 mb-2 text-xs font-semibold text-gray-500">Forma pastilla (IndicadorModo / InsigniasModo):</p>
          <div className="flex flex-col gap-2">
            <InsigniasModo salud={SALUD_LIVE} />
            <InsigniasModo salud={{ modo_ia: "mock", modelo: "mock", base_datos: "desactivada" }} />
            <InsigniasModo salud={{ modo_ia: "live", modelo: "deepseek-v4.1-flash", base_datos: "error" }} />
            <div className="flex flex-wrap gap-2">
              <InsigniasModo salud={null} />
              <InsigniasModo error />
            </div>
          </div>
        </Seccion>

        <Seccion nombre="Botón" archivo="Boton.jsx · DESING.md §2.1 y §2.2">
          <div className="flex flex-wrap items-center gap-2.5">
            <Boton variante="primario" tamano="grande" icono="check">Aprobar despacho</Boton>
            <Boton variante="vino" icono="despliegue">Plan de sector</Boton>
            <Boton icono="editar">Editar</Boton>
            <Boton variante="peligro" icono="cruz">Rechazar</Boton>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <Boton variante="primario" disabled motivoDeshabilitado="Escribe un reporte primero">
              Analizar reporte
            </Boton>
            <Boton icono="reintentar">Reintentar</Boton>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Primario con <code>muni-primary-a11y</code> (<code>#AE0101</code>, contraste WCAG AA &ge; 4.5:1 con blanco).
          </p>
        </Seccion>

        <Seccion nombre="Franja de estado" archivo="FranjaEstado.jsx" ancho>
          <div className="flex flex-col gap-2.5 overflow-hidden rounded-xl border border-gray-200">
            <FranjaEstado
              className="px-5"
              ocupado
              mensaje="Analizando reportes del sector…"
              detalle="· la IA está clasificando residuos y verificando evidencia"
              pasos={[{ nombre: "Reporte", estado: "hecho" }, { nombre: "Triage IA", estado: "actual" }, { nombre: "Despacho", estado: "pendiente" }]}
            />
            <FranjaEstado
              className="px-5"
              tono="ok"
              mensaje="Despacho aprobado"
              detalle="· por Encargado Gestión de Calidad a las 09:14 · ejecución simulada en la demo"
              pasos={[{ nombre: "Reporte", estado: "hecho" }, { nombre: "Triage IA", estado: "hecho" }, { nombre: "Despacho", estado: "hecho" }]}
            />
            <FranjaEstado
              className="px-5"
              tono="error"
              mensaje="No se pudo completar el triage"
              detalle="· Kostra limitó las peticiones (429) · se reintentó 1 vez"
              pasos={[{ nombre: "Reporte", estado: "hecho" }, { nombre: "Triage IA", estado: "error" }, { nombre: "Despacho", estado: "pendiente" }]}
            />
          </div>
        </Seccion>

        <Seccion nombre="Lista resaltable (reportes / señales)" archivo="ListaSenales.jsx">
          <ListaSenalesDemo />
        </Seccion>

        <Seccion nombre="Razonamiento en vivo" archivo="RazonamientoEnVivo.jsx">
          <RazonamientoEnVivo segundos={3.1} pasos={PASOS_RAZONAMIENTO} etiqueta="Clasificando reportes del sector" />
          <p className="mt-4 mb-2 text-xs font-semibold text-gray-500">Pasado 20 s (aviso de espera larga):</p>
          <RazonamientoEnVivo segundos={24.6} texto="Se detectaron 4 reportes coincidentes en República de Chile…" />
        </Seccion>

        <Seccion nombre="Evidencia: píldoras y texto resaltado" archivo="ChipsEvidencia.jsx · TextoEvidencia.jsx">
          <ChipsTextoDemo />
        </Seccion>

        <Seccion nombre="Panel de aprobación" archivo="PanelAprobacion.jsx">
          <PanelAprobacion
            accion="Despachar camión tolva y cuadrilla a República de Chile"
            riesgo={{ tono: "critico", texto: "Prioridad alta · vereda obstruida frente a plaza" }}
            ficha={FICHA}
            onAprobar={() => {}}
            onEditar={() => {}}
            onRechazar={() => {}}
            simulado
          />
        </Seccion>

        <Seccion nombre="Registro de la acción" archivo="RegistroAccion.jsx">
          <RegistroAccion items={REGISTRO} />
        </Seccion>

        <Seccion nombre="Avisos / Callouts Semánticos" archivo="Aviso.jsx · DESING.md §6.2">
          <div className="flex flex-col gap-3">
            <Aviso tono="info">El texto de los vecinos se procesa como <b>datos, no como instrucciones</b>.</Aviso>
            <Aviso tono="adv">El ahorro de tiempo de triage es un <b>estimado</b> a validar en el piloto municipal.</Aviso>
            <Aviso tono="ok">3 de 3 evidencias verificadas literalmente en el reporte.</Aviso>
            <Aviso tono="error" titulo="Kostra limitó las peticiones (429).">Espera unos segundos y reintenta.</Aviso>
          </div>
        </Seccion>

        <Seccion nombre="Estado vacío" archivo="EstadoVacio.jsx · DESING.md §5.2">
          <EstadoVacio
            icono="documento"
            mensaje="¿Quieres probar con un reporte vecinal?"
            detalle="Selecciona un caso simulado de Rancagua:"
            ejemplos={[TEXTO_RECLAMO]}
            onEjemplo={() => {}}
          />
        </Seccion>

        <Seccion nombre="Carga y fallback de error" archivo="Cargando.jsx · MensajeError.jsx">
          <Cargando />
          <div className="mt-4">
            <MensajeError mensaje="Kostra limitó las peticiones (429). Espera unos segundos y reintenta." alReintentar={() => {}} />
          </div>
        </Seccion>

        <Seccion nombre="Resultado del análisis" archivo="TarjetasResultado.jsx">
          <TarjetasResultado respuesta={RESPUESTA_ANALISIS} textoAnalizado={TEXTO_RECLAMO} />
        </Seccion>

        <div>
          <ListaHistorial datos={HISTORIAL} />
        </div>

        <Seccion nombre="Íconos (lucide-react)" archivo="Iconos.jsx · <Icono nombre=… />" ancho>
          <div className="flex flex-wrap gap-4">
            {NOMBRES_ICONOS.map((nombre) => (
              <span
                key={nombre}
                className="flex w-24 flex-col items-center gap-1.5 rounded-xl border border-rose-200/70 bg-rose-50/25 p-2.5 text-xs font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-300"
              >
                <Icono nombre={nombre} className="h-6 w-6 text-[#8C1D28] dark:text-rose-300" />
                {nombre}
              </span>
            ))}
          </div>
        </Seccion>

        <div className="xl:col-span-2">
          <VistaCalidad datos={EVALUACION} />
        </div>
      </div>
    </div>
  );
}

function Seccion({ nombre, archivo, ancho, children }) {
  return (
    <Tarjeta
      titulo={nombre}
      subtitulo={<span className="font-mono text-2xs">{archivo}</span>}
      className={ancho ? "xl:col-span-2" : ""}
    >
      {children}
    </Tarjeta>
  );
}

function ListaSenalesDemo() {
  const [activa, setActiva] = useState("S2");
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
  const [activo, setActivo] = useState("E1");
  return (
    <div className="flex flex-col gap-4">
      <ChipsEvidencia chips={chips} activo={activo} onSeleccionar={setActivo} descartadas={0} />
      <TextoEvidencia
        texto={TEXTO_RECLAMO}
        evidencia={evidencia}
        fragmentoActivo={chips.find((c) => c.id === activo)?.texto}
      />
    </div>
  );
}

function PantallaCompuesta() {
  const [seleccion, setSeleccion] = useState("S2");
  const [estado, setEstado] = useState("pendiente");

  const senales = SENALES.map((s) => (s.id === seleccion && s.estado !== "ruido" ? { ...s, estado: "activa" } : s));
  const pasos = [
    { nombre: "Reportes", estado: "hecho" },
    { nombre: "Triage IA", estado: "hecho" },
    { nombre: "Despacho", estado: estado === "aprobada" ? "hecho" : "actual" },
  ];

  return (
    <section aria-label="Ejemplo de pantalla compuesta" className="my-6 border-y border-rose-200/80 dark:border-gray-800">
      <p className="bg-[#8C1D28] px-4 py-2 text-xs sm:text-sm font-semibold text-white sm:px-6 lg:px-8">
        Vista Encargado Municipal · Bandeja de reportes agrupados + Triage con evidencia + Aprobación de despacho
      </p>
      {estado === "aprobada" ? (
        <FranjaEstado
          className="px-4 sm:px-6 lg:px-8"
          tono="ok"
          mensaje="Despacho aprobado"
          detalle="· por Encargado Gestión de Calidad a las 09:14 · ejecución simulada en la demo"
          pasos={pasos}
        />
      ) : estado === "rechazada" ? (
        <FranjaEstado className="px-4 sm:px-6 lg:px-8" mensaje="Propuesta rechazada" detalle="· no se despachó recurso" pasos={pasos} />
      ) : (
        <FranjaEstado
          className="px-4 sm:px-6 lg:px-8"
          mensaje="Triage de sector listo"
          detalle="· 8 avisos procesados en 2,9 s · 3 descartados fuera de dominio · esperando aprobación"
          pasos={pasos}
        />
      )}
      <div className="grid grid-cols-1 items-start gap-5 bg-gray-50 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,0.9fr)] dark:bg-gray-950">
        <Tarjeta titulo="Avisos recibidos" subtitulo="5 de residuos · 3 fuera de dominio" relleno={false} calida>
          <ListaSenales items={senales} onSeleccionar={setSeleccion} />
        </Tarjeta>

        <Tarjeta titulo="Diagnóstico del sector" subtitulo="República de Chile" calida>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Insignia tono="critico" icono="error">Prioridad alta · vereda obstruida</Insignia>
              <Insignia tono="vino" icono="documento">Residuo: mixto (voluminosos + domiciliario)</Insignia>
            </div>
            <p className="text-xl font-bold leading-snug tracking-tight text-gray-900 dark:text-white">
              4 reportes vecinales coinciden en acumulación de colchones y bolsas rotas frente a la plaza de República de
              Chile con Recreo.
            </p>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Peligrosidad <b className="text-gray-900 dark:text-white">media</b> por presencia de perros dispersando
              residuos y bloqueo peatonal. <b className="text-gray-900 dark:text-white">Falta confirmar</b> numeración
              exacta frente a la plaza.
            </p>
            <ChipsEvidencia
              chips={CHIPS}
              activo={seleccion}
              onSeleccionar={setSeleccion}
              titulo="Evidencia citada · verificada en los reportes"
              dondeSeVerifico="en los reportes"
            />
          </div>
        </Tarjeta>

        <Tarjeta titulo={estado === "aprobada" ? "Registro del despacho" : "Recurso propuesto"} calida>
          {estado === "aprobada" ? (
            <div className="flex flex-col gap-4">
              <RegistroAccion items={REGISTRO} />
              <Boton onClick={() => setEstado("pendiente")} className="self-start">
                Volver a la propuesta
              </Boton>
            </div>
          ) : estado === "rechazada" ? (
            <div className="flex flex-col gap-4">
              <EstadoVacio icono="candado" mensaje="Despacho rechazado." detalle="No se asignó cuadrilla." />
              <Boton onClick={() => setEstado("pendiente")} className="self-start">
                Volver a la propuesta
              </Boton>
            </div>
          ) : (
            <PanelAprobacion
              accion="Despachar camión tolva y cuadrilla estándar a República de Chile"
              riesgo={{ tono: "adv", texto: "Requiere tolva por colchones voluminosos" }}
              ficha={FICHA}
              onAprobar={() => setEstado("aprobada")}
              onEditar={() => {}}
              onRechazar={() => setEstado("rechazada")}
              textoAprobar="Aprobar despacho"
              simulado
            />
          )}
        </Tarjeta>
      </div>
    </section>
  );
}
