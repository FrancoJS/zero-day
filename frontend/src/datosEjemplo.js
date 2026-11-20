// Datos de EJEMPLO con la forma exacta de odd/contrato-api.md v2 (SIMULADOS).
// Sirven para construir las vistas antes de que exista el backend; luego se cambian por api.js.

export const SECTORES = [
  { id: "centro", nombre: "Centro", lat: -34.1705, lng: -70.7407 },
  { id: "norte", nombre: "Rancagua Norte", lat: -34.154, lng: -70.742 },
  { id: "sur", nombre: "Rancagua Sur", lat: -34.189, lng: -70.739 },
  { id: "oriente", nombre: "Oriente", lat: -34.169, lng: -70.718 },
  { id: "poniente", nombre: "Poniente", lat: -34.172, lng: -70.765 },
  { id: "nororiente", nombre: "Nororiente", lat: -34.156, lng: -70.721 },
  { id: "suroriente", nombre: "Suroriente", lat: -34.187, lng: -70.72 },
  { id: "surponiente", nombre: "Surponiente", lat: -34.188, lng: -70.762 },
];

const nombre = (id) => SECTORES.find((s) => s.id === id).nombre;
const haceHoras = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();

function reporte(id, sector, horas, texto, resultado, extra = {}) {
  return {
    id,
    texto,
    sector: { id: sector, nombre: nombre(sector) },
    creado_en: haceHoras(horas),
    simulado: true,
    estado: "pendiente",
    decidido_en: null,
    nota_decision: null,
    reportes_en_sector: 1,
    analisis: { resultado, modo: "live", modelo: "deepseek-v4.1-flash", latencia_ms: 2900, evidencia_descartada: 0 },
    ...extra,
  };
}

const r = (tipo_residuo, peligrosidad, prioridad, accion_sugerida, resumen, evidencia, falta = [], ubicacion = null) => ({
  tipo_residuo, peligrosidad, prioridad, accion_sugerida, resumen,
  falta_informacion: falta, ubicacion,
  pregunta_seguimiento: falta.length ? "¿Cabe en una camioneta o se necesita un camión?" : null,
  evidencia,
});

const REPORTES = [
  reporte(127, "sur", 48,
    "Botaron escombros y un colchón en la esquina del pasaje Los Aromos con Av. España, justo al lado del colegio. Los niños tienen que bajarse a la calle para pasar.",
    r("mixto", "media", "alta", "camion_tolva", "Escombros y colchón junto a un colegio; obliga a los niños a pasar por la calle.",
      ["justo al lado del colegio", "tienen que bajarse a la calle"], ["volumen aproximado"], "pasaje Los Aromos con Av. España"),
    { reportes_en_sector: 3 }),
  reporte(131, "poniente", 24,
    "Están quemando basura en el sitio junto al canal, sale mucho humo y llega a las casas.",
    r("domiciliario", "alta", "alta", "fiscalizacion", "Quema de basura junto al canal con humo hacia las viviendas.",
      ["quemando basura", "junto al canal"], [], "sitio junto al canal")),
  reporte(135, "surponiente", 5,
    "Dejaron bidones de aceite usado en el sitio eriazo al final de la calle, se está derramando.",
    r("peligroso", "alta", "alta", "retiro_especializado", "Bidones de aceite usado derramándose en un sitio eriazo.",
      ["bidones de aceite usado", "se está derramando"], [], "sitio eriazo al final de la calle")),
  reporte(122, "oriente", 48,
    "Hay un sillón y un refrigerador botados en el pasaje hace más de una semana.",
    r("voluminoso", "baja", "media", "camion_tolva", "Sillón y refrigerador abandonados en un pasaje hace más de una semana.",
      ["un sillón y un refrigerador", "hace más de una semana"])),
  reporte(133, "sur", 24, "Bolsas y cartones en la vereda de calle Carrera, ya van varios días.",
    r("domiciliario", "baja", "media", "cuadrilla_estandar", "Bolsas y cartones acumulados en la vereda de calle Carrera.",
      ["Bolsas y cartones", "varios días"], [], "vereda de calle Carrera"),
    { reportes_en_sector: 3 }),
  reporte(138, "centro", 20, "Bolsas de basura tiradas en la plaza desde el fin de semana, ya huele mal.",
    r("domiciliario", "baja", "media", "cuadrilla_estandar", "Bolsas de basura en la plaza desde el fin de semana.",
      ["Bolsas de basura tiradas en la plaza"], [], "la plaza")),
  reporte(140, "nororiente", 6, "Dejaron ramas de poda en la vereda, se puede pasar pero estorba.",
    r("poda", "baja", "baja", "cuadrilla_estandar", "Ramas de poda en la vereda; estorban pero no bloquean.",
      ["ramas de poda en la vereda"])),
  reporte(142, "sur", 3, "Unas pocas bolsas junto al paradero.",
    r("domiciliario", "baja", "baja", "cuadrilla_estandar", "Pocas bolsas junto al paradero; sin riesgo inmediato.",
      ["Unas pocas bolsas junto al paradero"], [], "junto al paradero"),
    { reportes_en_sector: 3 }),
  reporte(118, "norte", 30, "Muebles viejos botados en la esquina.",
    r("voluminoso", "baja", "baja", "camion_tolva", "Muebles viejos en una esquina.", ["Muebles viejos"]),
    { estado: "aprobado", decidido_en: haceHoras(3), nota_decision: null }),
];

const ORDEN = { alta: 0, media: 1, baja: 2 };

function porSector(reportes) {
  return SECTORES.map((s) => {
    const delSector = reportes.filter((x) => x.sector.id === s.id);
    const pendientes = delSector.filter((x) => x.estado === "pendiente");
    const prioridades = pendientes.map((x) => x.analisis.resultado.prioridad).sort((a, b) => ORDEN[a] - ORDEN[b]);
    return { sector_id: s.id, nombre: s.nombre, lat: s.lat, lng: s.lng,
      pendientes: pendientes.length, total: delSector.length, prioridad_max: prioridades[0] ?? null };
  }).filter((s) => s.total > 0);
}

/** Igual que GET /api/reportes: pendientes primero, prioridad alta→baja, el más antiguo primero. */
export const BANDEJA = {
  reportes: [...REPORTES].sort(
    (a, b) =>
      (a.estado !== "pendiente") - (b.estado !== "pendiente") ||
      ORDEN[a.analisis.resultado.prioridad] - ORDEN[b.analisis.resultado.prioridad] ||
      a.creado_en.localeCompare(b.creado_en),
  ),
  por_sector: porSector(REPORTES),
};

/** Dos turnos del chat del vecino (POST /api/reportes/borrador). */
export const BORRADOR_TURNO_1 = {
  analisis: {
    resultado: r("mixto", "media", "alta", "camion_tolva",
      "Escombros y colchón junto a un colegio en Rancagua Sur.",
      ["justo al lado del colegio"], ["volumen aproximado"], "pasaje Los Aromos con Av. España"),
    modo: "live", modelo: "deepseek-v4.1-flash", intentos: 1, latencia_ms: 3100,
    uso: { tokens_entrada: 731, tokens_salida: 420, costo_usd_estimado: null, costo_clp_estimado: 0.48 },
    evidencia_descartada: 0, guardado: false,
  },
  completo: false,
};

export const BORRADOR_TURNO_2 = {
  ...BORRADOR_TURNO_1,
  analisis: {
    ...BORRADOR_TURNO_1.analisis,
    resultado: { ...BORRADOR_TURNO_1.analisis.resultado, falta_informacion: [], pregunta_seguimiento: null,
      resumen: "Escombros y colchón junto a un colegio; se necesita camión." },
  },
  completo: true,
};
