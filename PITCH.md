# PITCH.md — Plantilla según la rúbrica (completar el día del evento)

5 min de pitch con demo + 3 min de preguntas. Escala: **3** = cumple lo esencial · **4** = sustenta decisiones y **reconoce limitaciones** · **5** = evidencia concreta y consistente.
Regla de oro: cada afirmación tiene un respaldo que se puede mostrar. Lo estimado se dice estimado; lo simulado se dice simulado.

## Cobertura de la rúbrica (revisar antes de ensayar)

| Criterio | Indicador | Dónde lo cubre el pitch | Evidencia que mostramos | Completar mañana |
|---|---|---|---|---|
| Relevancia 25% | Definición del problema | §1 Problema | dato del desafío | qué falla y su consecuencia |
| | Comprensión del usuario | §1 Usuario y momento | la pantalla muestra su paso del flujo | rol y momento exacto |
| | Evidencia y contexto | §1 Evidencia + supuestos | antecedentes del desafío, conversación con mentores/partner | 2–3 supuestos por validar |
| | Foco | §1 Foco | "qué resolvemos y qué no" | parte concreta y por qué |
| Solidez 30% | Funcionamiento | §2 Flujo + demo | app en la IP pública, indicador **Kostra LIVE** | caso de demo |
| | Real vs simulado | §2 Tabla | etiquetas SIMULADO en pantalla | ajustar filas |
| | Uso de IA y nube | §2 IA y nube | Kostra + ECS Huawei Santiago | tarea exacta de la IA |
| | Calidad del resultado | §2 Calidad | **panel de calidad** (base: 7/8 por categoría) | re-medir con casos del desafío |
| | Decisiones técnicas y riesgos | §2 Decisiones + Riesgos | evidencia verificada, inyección, datos sensibles, aprobación | riesgo propio del desafío |
| Impacto 25% | Valor e indicador (estimado vs observado) | §3 Indicadores | latencia, precisión y costo **observados** | beneficio **estimado** con supuesto |
| | Integración operativa | §3 Integración | — | proceso, sistemas, quién supervisa |
| | Piloto | §3 Piloto | — | usuarios, datos, duración, criterio de éxito |
| | Recursos y dependencias | §3 Recursos | costo observado ≈ $0,40 CLP/análisis | permisos y datos |
| Pitch 20% | Claridad de la historia | §4 Guion | — | ensayar 2 veces |
| | Demostración | §4 Demo guiada | flujo del diseño 05: entrada → analizando → diagnóstico → aprobación | un caso concreto |
| | Dominio del equipo | §4 Dominio | decisiones explicadas por quien las tomó | experiencia de cada uno |
| | Coordinación | §4 Guion (3 personas) | cada uno habla de su parte | quién responde qué pregunta |

---

## 1. Relevancia del desafío (25%)

**Enfoque elegido:** O'Higgins Circular → **triage de reportes de microbasurales** para el municipio de Rancagua.

**Problema (qué falla hoy y qué consecuencia tiene para la operación):**
> _Completar con el dato de mentores/partner. Borrador: "Los reportes de microbasurales llegan como texto libre, repetidos y sin clasificar; se atienden por orden de llegada y no por riesgo, y mientras tanto el microbasural crece."_

**Usuario y momento del flujo:**
- Quién la usa: encargado municipal de aseo / medio ambiente
- Quién se beneficia: vecinos del sector reportado
- En qué momento interviene: cuando llega un reporte y hay que decidir qué atender primero y con qué recurso

**Evidencia y contexto:** _(antecedentes del desafío, datos entregados, conversación con mentores/partner)_

**Supuestos que todavía hay que validar** (decirlos en voz alta suma puntos):
1. _(ej.: "que los tickets traen la ubicación en el texto")_
2. _(ej.: "que el usuario acepta revisar la propuesta antes de ejecutarla")_
3. _…_

**Foco:** resolvemos _(una parte concreta)_ porque _(por qué vale la pena)_. **No** resolvemos _(lo que queda fuera)_.

---

## 2. Solidez técnica (30%)

**Flujo principal (entrada → procesamiento → resultado):**
> _entrada representativa_ → IA (Kostra, deepseek-v4.1-flash) _(qué tarea exacta)_ → código valida _(qué)_ → _resultado que el usuario usa para…_

**Qué es real y qué es simulado:**

| Componente | Estado |
|---|---|
| Llamada a la IA (Kostra) | Real (indicador LIVE en pantalla) |
| Validación del JSON y evidencia verificada | Real |
| Servidor en Huawei Cloud (ECS, Santiago) | Real |
| Datos de entrada | _Simulados / del desafío_ |
| Integración con sistemas del cliente | _Simulada / fuera de alcance_ |
| Ejecución de la acción propuesta | _Simulada: solo se registra la aprobación_ |

**Uso de IA y nube:**
- La IA hace: _(entender lenguaje natural / extraer / clasificar / razonar sobre evidencia)_. El código hace: _(filtrar, validar, buscar en BD, pedir aprobación)_.
- La nube aporta: servidor en Huawei Cloud Santiago (latencia y datos en Chile), modelo vía Kostra con pago por uso, sin infraestructura de GPU propia.
- Por qué estas herramientas: _(modelo rápido y barato para una tarea acotada; etc.)_

**Decisiones técnicas (cómo se conectan los componentes y qué datos requieren):**
> Navegador → frontend (React) → backend (FastAPI) → Kostra (IA) y Postgres, todo en un ECS de Huawei Cloud con Docker Compose. La key de la IA vive solo en el servidor; el navegador nunca la ve.
- Datos que requiere: _(qué entra, en qué formato, de qué fuente; qué se guarda y qué no)_.
- Por qué así: un solo flujo y pocas piezas (menos cosas que fallen); la IA en una tarea acotada y el código validando alrededor.

**Calidad del resultado (mostrar el panel de calidad):**
- Evaluación con **N casos** contra Kostra real: **X/N aciertos**, latencia promedio **Y s**.
- Categorías probadas: normal, ambiguo, **intento de inyección**, **fuera de dominio**, **datos sensibles**, lenguaje informal.
- Errores observados: _(qué casos fallan y por qué — esto es lo que da el 4)_

**Riesgos y cómo los abordamos:**

| Riesgo | Mitigación implementada |
|---|---|
| Respuesta incorrecta / inventada | JSON validado con esquema cerrado; evidencia citada se verifica contra el texto y se descarta si no existe |
| Datos incompletos | _(la IA pregunta / marca "falta información" en vez de inventar)_ |
| Información sensible | Prompt prohíbe repetir RUT/correos/teléfonos; caso de evaluación que lo verifica |
| Instrucciones maliciosas en el texto (prompt injection) | El texto se trata como datos, no instrucciones; caso de evaluación que lo verifica |
| Kostra lento o caído | Timeout, reintento ante 429, error claro en pantalla; nunca cambia a MOCK en silencio |
| Acción equivocada | Nada se ejecuta sin aprobación humana |

---

## 3. Impacto y viabilidad (25%)

**Beneficio concreto e indicador:**

| Indicador | Valor | Tipo |
|---|---|---|
| Tiempo de respuesta de la IA | _Y s promedio_ | **Observado** (panel de calidad) |
| Precisión en casos de prueba | _X/N_ | **Observado** |
| Costo por análisis | _≈ $0,4 CLP_ | **Observado** (tokens reales × precio Kostra) |
| Tiempo ahorrado por caso | _de A min a B min_ | **Estimado** — supuesto: _(…)_ |

**Integración operativa:** se incorpora en _(proceso)_, se conecta con _(sistemas/fuentes de datos)_, lo usa _(rol)_ y lo supervisa _(rol)_.

**Piloto propuesto:**
- Usuarios: _(n personas, qué área)_
- Datos: _(qué fuente, cuánto volumen, anonimizados)_
- Alcance y duración: _(ej.: 2 semanas, un solo tipo de caso)_
- **Criterio de éxito:** _(ej.: "≥ 80% de coincidencia con la decisión del experto y ≤ 1 error grave")_ → si se cumple, se avanza a _(siguiente paso)_.

**Recursos y dependencias:** permisos de acceso a _(datos/sistemas)_, costo de IA (≈ $0,4 CLP por análisis) y servidor, datos reales anonimizados, cambio operativo: _(quién revisa y aprueba)_.

**Propuesta de valor (la venta, en una frase):**
> _"Para [quién paga], que hoy pierde [tiempo/dinero/errores] en [proceso], [producto] [qué hace] en [tiempo], con un costo de [≈ $X por caso] y siempre con aprobación humana."_

**Quién paga y quién usa** (no siempre es la misma persona):
- Compra: _(ej.: jefe de operaciones / gerente de sostenibilidad)_ — le importa: _(costo, riesgo, cumplimiento)_
- Usa: _(ej.: operador de guardia / jefe de obra)_ — le importa: _(ahorro de tiempo, menos errores)_

**Por qué conviene (retorno simple, marcado como estimado):**
> _"Si un caso toma A min a mano y B min con la herramienta, con N casos al mes se ahorran (A−B)×N minutos. El costo de IA es ≈ $0,4 CLP por caso (observado). **Estimado**, supuesto a validar en el piloto: (…)"_

**Modelo de cobro tentativo** (decirlo como hipótesis, no como hecho): _(ej.: suscripción mensual por equipo / por volumen de casos)_.

**El pedido (cierre de venta):** qué le pedimos al jurado o al partner.
> _"Buscamos una empresa que nos dé [datos anonimizados de N casos] y [n usuarios] por [2 semanas] para probar el criterio de éxito de arriba."_

⚠️ Nada de tamaños de mercado ni ahorros millonarios sin fuente: el jurado pregunta "¿cómo lo calcularon?". Mejor un retorno chico, con supuestos explícitos, que uno grande imposible de defender.

---

## 4. Pitch y equipo (20%) — guion de 5 minutos

| Tiempo | Quién | Qué |
|---|---|---|
| 0:00–0:45 | Líder | Problema, usuario y consecuencia (con dato) |
| 0:45–1:15 | Líder | Foco: qué resolvemos y qué no |
| 1:15–3:00 | Líder (habla) + Frontend (maneja la pantalla) | **Demo guiada con UN caso concreto**, en 4 tiempos: 1) qué entra, 2) qué ve el jurado mientras la IA trabaja, 3) qué significa el resultado (evidencia resaltada), 4) qué hace el usuario con eso (aprobar/rechazar). Señalar el indicador **Kostra LIVE** |
| 3:00–3:50 | Backend/IA | Cómo funciona, qué hace la IA y qué el código, y cómo comprobamos la calidad (panel: X/N por categoría, el caso que falla y por qué) |
| 3:50–4:35 | Líder | Viabilidad: costo observado, retorno estimado, piloto y criterio de éxito |
| 4:35–5:00 | Líder | Limitaciones reconocidas y **cierre de venta**: la propuesta de valor en una frase + el pedido (piloto) |

**Dominio del equipo (decirlo en una frase cada uno, o en las preguntas):** _(qué experiencia o capacidad aplicó cada uno y qué decisión clave tomó: ej. "decidimos que la IA solo cite evidencia verificable porque…")_. Quien tomó la decisión es quien la defiende.

**Preguntas: quién responde.** Líder: problema, usuario, piloto, costos. Backend/IA: calidad, riesgos, por qué este modelo. Frontend: experiencia del usuario y qué es simulado en pantalla.

**Limitaciones que decimos nosotros (antes de que pregunten):**
1. _(ej.: datos simulados; falta validar con usuarios reales)_
2. _(ej.: el caso X falla en la evaluación porque…)_
3. _(ej.: latencia de Kostra variable; puede tardar más de 20 s)_

**Preguntas probables del jurado (respuesta preparada):**
- ¿Qué pasa si la IA se equivoca? → validación + evidencia verificada + aprobación humana.
- ¿Cómo saben que funciona? → panel de calidad, casos por categoría, errores conocidos.
- ¿Cuánto cuesta? → costo observado por análisis + servidor por hora.
- ¿Qué es real y qué simulado? → tabla de la sección 2.
- ¿Qué necesita una empresa para probarlo? → piloto de la sección 3.
- **Recurso:** si sobra tiempo, invitar al jurado a dar un caso propio (solo si se ensayaron casos difíciles).

**Checklist 15:15 (antes de presentar):**
- [ ] App abierta en la IP pública, indicador **Kostra LIVE**
- [ ] Un análisis de prueba responde
- [ ] Panel de calidad con la última corrida **live**
- [ ] Video de respaldo abierto en otra pestaña
- [ ] Key de la demo sin uso de agentes desde las 14:30
