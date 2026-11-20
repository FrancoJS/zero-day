# Rediseño a la identidad municipal — cambios y objetivo

Fecha: 20-11-2026 · Rama: `refactor/desing`
Fuente de verdad de diseño: [`DESING.md`](./DESING.md) + [`skills/design.skill`](./skills/design.skill) + [`frontend/src/global.css`](./frontend/src/global.css)

## Objetivo

Alinear toda la interfaz y el kit de componentes con el **Sistema de Diseño de la Municipalidad de Rancagua** ([`DESING.md`](./DESING.md)), manteniendo el stack del proyecto (**Tailwind v3 + JSX**, sin TypeScript):

1. **Dos capas cromáticas institucionales (`DESING.md` §2):**
   - **Paleta oficial (`muni-primary-*`):** Rojo vivo institucional (`#C30101`) para el Navbar `.cta-bg`, bordes activos y acentos; **`muni-primary-a11y` (`#AE0101`)** para botones primarios sólidos y píldoras activas (cumple contraste WCAG AA $\ge 4.5:1$ con texto blanco, donde `#C30101` está prohibido); `muni-primary-700` (`#D90000`) para `:hover`; `destacado` (`#FFF1D2`) para resaltado de evidencia.
   - **Sub-paleta Borgoña / Vino (`#8C1D28` + `rose-*`):** Aplicada en componentes de alto contacto visual (`Tarjeta`, `FranjaEstado`, `ChipsEvidencia`, `TextoEvidencia`, `ListaSenales`, `EstadoVacio`, `PanelAprobacion`, `PanelCalidad`, `RazonamientoEnVivo`) para brindar calidez y evitar fatiga visual por exceso de rojo saturado.
2. **Accesibilidad Global (`DESING.md` §6.1):**
   - Anillo bicolor `:focus-visible` (`#1877f2` con halo blanco `#ffffff` en modo claro y `#4f98a3` en modo oscuro), soporte `forced-colors: active`, `prefers-reduced-motion: reduce`, `.visually-hidden` y enlace "Saltar al contenido principal" (*skip link*).
3. **Tipografía y Jerarquía (`DESING.md` §3):**
   - Fuente **Open Sans**, sobretítulos (*eyebrows*) en `text-2xs`/`text-xs uppercase tracking-wider text-[#8C1D28]`, y `tabular-nums` obligatorio en cronómetros, métricas, latencias, costos en CLP y horas.
4. **Iconografía (`DESING.md` §1):**
   - **`lucide-react`** con imports nombrados en [`Iconos.jsx`](./frontend/src/components/Iconos.jsx) (`strokeWidth={2}` general, `strokeWidth={1.5}` en esferas de estado vacío).

## Cambios por archivo

| Archivo | Cambio |
|---|---|
| `frontend/tailwind.config.js` | `theme.extend.colors` preserva las escalas de Tailwind (`rose`, `emerald`, `amber`, `red`, `blue`, `gray`, `slate`…) y agrega `muni-primary-*`, `vino` (`#8C1D28` / `#A5222F` / `#6B151E`), `destacado` (`#FFF1D2`) y los tokens del kit (`acento`, `texto`, `ok`, `adv`, `parcial`, `critico`). Añade `shadow-xs`, `spacing.4.5`/`19`/`113`, `text-2xs`, breakpoints `xs`/`3xl` y fuente **Open Sans**. |
| `frontend/src/global.css` | Consolida `accessibility.css` (§6.1) y `global.css` (§6.2) de `DESING.md` portados a Tailwind v3 (`.cta-bg`, `.bg-navbar`, `.card`, `.btn-primario-solid`, `.btn-gris`, `.destacado`, `.restriccion`, `.informacion`, `.search-input`, `.page-content-transition`). |
| `frontend/src/components/Encabezado.jsx` | Rediseñado como **Navbar Institucional** (§5.1): `<header className="sticky top-0 z-40 ... cta-bg">`, emblema blanco translúcido, separador `bg-white/30`, doble línea ("Municipalidad de Rancagua" + "Zero Day") e indicadores a la derecha. |
| `frontend/src/components/Tarjeta.jsx` | Cabecera con indicador vertical y sobretítulo en Borgoña/Vino (`#8C1D28`), variante `calida` con borde `border-rose-200/80` y sombra suave (§5.2). |
| `frontend/src/components/Boton.jsx` | Variante `primario` con `bg-muni-primary-a11y hover:bg-muni-primary-700` (WCAG AA), `secundario` estilo `.btn-gris-xl`, nueva variante `vino` (`#8C1D28`) y `peligro` en `red-*`, con micro-interacción `active:scale-[0.98]`. |
| `frontend/src/components/Insignia.jsx` · `IndicadorModo.jsx` | Estados semánticos (`emerald`, `amber`, `orange`, `red`), tono institucional `acento` (`bg-muni-primary/10 text-muni-primary-a11y-800`) y nuevo tono `vino` (`bg-rose-50/90 text-[#8C1D28] border-rose-200/90`). |
| `frontend/src/components/FranjaEstado.jsx` | Usa la sub-paleta cálida `bg-rose-50/60 border-rose-200/80 text-[#8C1D28]` en estado informativo/operativo, `emerald` en completado y `red` en error; pasos con `tabular-nums`. |
| `frontend/src/components/Aviso.jsx` | Callouts semánticos `.informacion` (`blue-*`), `.destacado` (`amber-*`), `.restriccion` (`red-*`) y éxito (`emerald-*`). |
| `frontend/src/components/ChipsEvidencia.jsx` · `TextoEvidencia.jsx` | Píldoras de evidencia (§5.4.3) con estado activo `bg-muni-primary-a11y` e inactivo en `rose-50/40 text-[#8C1D28]`; texto resaltado con token `bg-destacado` (`#FFF1D2`). |
| `frontend/src/components/ListaSenales.jsx` | Filas cálidas `border-rose-200/80 bg-rose-50/35`, estado activo con anillo `ring-muni-primary/20` e ícono en `bg-rose-50 text-[#8C1D28]`. |
| `frontend/src/components/PanelAprobacion.jsx` · `RegistroAccion.jsx` | Ficha sobre superficie cálida `bg-rose-50/25 border-rose-200/80`, línea de tiempo con checks `emerald`, horas `tabular-nums` y badge `SIMULADO` en `amber`. |
| `frontend/src/components/RazonamientoEnVivo.jsx` · `Cargando.jsx` | Cronómetro `tabular-nums` en `#8C1D28` sobre tarjeta `rose-50/25` y spinner municipal. |
| `frontend/src/components/EstadoVacio.jsx` · `MensajeError.jsx` | Esfera de ícono con `strokeWidth={1.5}` y botones de ejemplo estilo QuickStats/Accesos Directos (§5.2); fallback de error en contenedor `rose-*` (§2.4.3). |
| `frontend/src/components/TarjetasResultado.jsx` · `Historial.jsx` · `PanelCalidad.jsx` | Adaptados al esquema de microbasurales (`tipo_residuo`, `peligrosidad`, `accion_sugerida`, `falta_informacion`) y a la estética de QuickStats con `tabular-nums`. |
| `frontend/src/App.jsx` · `frontend/src/Galeria.jsx` | Skip link accesible, `.page-content-transition`, `.search-input`, casos de microbasurales de Rancagua y galería completa del sistema `DESING.md`. |
