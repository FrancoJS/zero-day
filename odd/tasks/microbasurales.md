# Microbasurales — triage municipal de reportes (O'Higgins Circular)

Prototipo para la Hackatón Huawei INACAP (20-11-2026, código congelado 14:30). Contexto completo en `AGENTS.md` §0.
Rama: `feat/microbasurales`. El push y el merge los hace el usuario.

## Specs

- **S1 — Contrato de la IA.** `ResultadoAnalisis` con valores cerrados: `tipo_residuo` ∈ `domiciliario, escombros, voluminoso, poda, peligroso, mixto, no_es_residuo`; `peligrosidad` ∈ `baja, media, alta`; `prioridad` ∈ `baja, media, alta`; `accion_sugerida` ∈ `cuadrilla_estandar, camion_tolva, retiro_especializado, fiscalizacion, derivar, pedir_mas_datos`; `resumen`; `falta_informacion` (lista); `evidencia` (citas literales verificadas).
- **S2 — Dominio y criterios en el prompt.** Dominio: residuos y microbasurales en espacios públicos de Rancagua. Fuera de dominio (luminarias, baches, ruidos, perros…) → `no_es_residuo` + `derivar`. Prioridad **alta**: residuo peligroso, quema, bloquea la vía o junto a colegio, canal o centro de salud; **media**: volumen grande o más de una semana; **baja**: poco volumen y sin riesgo. Se mantienen los delimitadores `<<< >>>` y la prohibición de repetir datos personales.
- **S3 — Catálogo de sectores (simulado).** ~8 sectores de Rancagua con id, nombre y coordenadas fijas. El vecino elige uno de la lista.
- **S4 — Vista vecino.** Formulario: texto + sector. Al enviar se analiza con la IA y se guarda el reporte.
- **S5 — Vista encargado.** Bandeja ordenada por prioridad; análisis con evidencia; agrupación: "N reportes en este sector" (coincidencia exacta de sector); Aprobar / Rechazar el despacho (**simulado**: solo se registra la decisión).
- **S6 — Mapa (después del checkpoint 11:45).** Leaflet + OpenStreetMap (sin `react-leaflet`), un marcador por sector: color = prioridad más alta, número = reportes; clic filtra la bandeja; si no carga, lista por sector con aviso. Si a las 12:30 no está, se queda la lista.
- **S7 — Evaluación.** `casos.json` con reportes de microbasurales conservando las categorías `normal, ambiguo, inyeccion, fuera_de_dominio, datos_sensibles, informal`; corrida live para el panel.
- **S8 — Servidor.** App en la IP pública de Huawei Cloud (bloqueado hasta tener acceso).
- **S9 — Contrato de la API de reportes (v2).** Definido en `odd/contrato-api.md`, modelos en `backend/esquemas.py`, catálogo en `backend/sectores.py`, ejemplos en `frontend/src/datosEjemplo.js`; v2 suma `ubicacion`, `pregunta_seguimiento` y `POST /api/reportes/borrador` (chat) (sectores, reportes, bandeja con `por_sector`, decisión simulada, semilla). Backend y frontend lo siguen tal cual; un cambio se hace ahí primero.

## Tasks

- [x] T1 — S1, S2: esquema, prompt y `analisis_mock` · inline (parent) · commit ver log
- [ ] T2 — S3, S4, S5, S9 backend: sectores, tabla de reportes, endpoints de reporte/bandeja/decisión · compañero de backend (PR, revisado en otra sesión)
- [x] T3 — S7 + pruebas al esquema nuevo · worker revisado por parent · 54 OK, mock 8/8 · commit ver log
- [ ] T4 — S4, S9 frontend vista vecino · compañero de frontend
- [ ] T5 — S5, S9 frontend vista encargado · compañero de frontend
- [ ] T6 — S8 servidor Huawei · bloqueado (sin acceso)
- [ ] T7 — S6 mapa Leaflet · después de 11:45
- [ ] T8 — evaluación live final + `PITCH.md`

## Log

- L1 (usuario): "si me parece bien lo de los microbasurales, esta perfecto, actualizas la documentacion y vemos el alcance ahora?"
- L2 (decisiones): entrada = "Vista vecino + vista encargado"; mapa = "Eso tambien lo queremos definir, lo ideal seria que si" → luego "Leaflet + OpenStreetMap (Recom.)"; duplicados = "Sí, por sector exacto (Recom.)".
- L3 (usuario): "justo uno de nosotros trabaja en la municipalidad asi que sabemos que hoy no hay nada de eso, y el lugar donde se ve todo lo de desechos es gestion de calidad" · roles: "yo veo infra, uno backend y otro front y se revisan los prs en la otra sesion" · T2 = compañero de backend. Diseño posterior: adaptar estilos (tokens de tailwind.config.js) a la web de la municipalidad.
- L4 (usuario): "si dejalo definida ahora y haces un pr pequeño asi despues partimso  con eso" → contrato en `odd/contrato-api.md`.
- L8 (usuario): "Aun no empieza el backend pero necesito poder definir los esquemas y todo lo necesario para que despues se junten nomas" · mapa de la app: "Leaflet + OpenStreetMap" → contrato v2 + esquemas + sectores.py + datosEjemplo.js + api.js (61 pruebas OK, mock 8/8).
