# Sistema de Diseño, Colores y Reglas UI/UX — Intranet Municipal de Rancagua

Este documento consolida **todas las reglas de diseño explícitas** (definidas en [DESIGN.md](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/DESIGN.md), [global.css](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/styles/global.css) y [accessibility.css](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/styles/accessibility.css)) junto con **todos los estilos, sub-paletas, patrones de interacción y arquitectura visual aplicados en los componentes reales** (`src/pages/**` y `src/components/**`). Está estructurado para que puedas trasladarlo directamente a otro proyecto o usarlo como contexto maestro (`DESIGN.md` / reglas de agente).

---

## 1. Stack Visual y Principios Base

- **Motor de estilos:** **Tailwind CSS v4** (`@tailwindcss/vite` + `@import "tailwindcss"`), sin kits externos (`@mui`, `antd`, `bootstrap`, `chakra`, `shadcn/ui`).
- **Modo Oscuro por clase:** `@custom-variant dark (&:where(.dark, .dark *));` controlado alternando la clase `.dark` en `document.documentElement` (`<html>`).
- **Iconografía dual:**
  1. **`lucide-react`** (imports nombrados obligatorios) para toda la interfaz general (`strokeWidth={2}` por defecto; `strokeWidth={1.5}` en placeholders o esferas grandes).
  2. **Iconos Sólidos Personalizados ([SolidIcons.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/icons/SolidIcons.jsx)):** SVGs `24×24` con `fill="currentColor"` y cortes en espacio negativo para el panel de **Accesos Directos**, **Métricas Rápidas del Hero** y **Encabezados de Calendario/Fechas**.
- **Carruseles:** **`swiper`** modular (`swiper/react` + `swiper/modules`: `Autoplay`, `Keyboard`).
- **Idioma y localización:** 100% español institucional chileno (`es-CL`). Fechas formateadas con `Intl.DateTimeFormat('es-CL', ...)` y montos con `Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })`.

---

## 2. Sistema Completo de Colores (Explícitos + Aplicados en Código)

> [!IMPORTANT]
> El proyecto utiliza **dos capas cromáticas institucionales**:
> 1. **La paleta oficial `@theme` (`muni-primary-*`)**: Rojo vivo institucional (`#c30101` / `#ae0101`) para Navbar, botones primarios, badges principales, encabezados de modales y focos de inputs.
> 2. **La sub-paleta Borgoña / Vino (`#8C1D28` + escala `rose-*`)**: Aplicada en componentes de alto contacto visual (Hero, Accesos Directos, Bienestar Social, Calendario y Directorio Telefónico) para brindar calidez y evitar fatiga visual por exceso de rojo saturado.

### 2.1 Tokens Oficiales en `@theme` ([global.css](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/styles/global.css#L8-L36))

| Token Tailwind | Valor Hex | Regla de Uso y Contraste |
|---|---|---|
| `muni-primary` | `#c30101` | Acento institucional principal: hover de títulos/enlaces (`hover:text-muni-primary`), bordes activos (`focus:border-muni-primary`), iconos en cabeceras de modales (`bg-muni-primary/10 text-muni-primary`), tab activa, inicio de gradientes. **Prohibido como fondo de botón con texto blanco pequeño** (no alcanza 4.5:1). |
| `muni-primary-a11y` | `#ae0101` | **Rojo accesible (WCAG AA >= 4.5:1 con blanco):** fondo de botones primarios sólidos (`.btn-primario-solid`), píldoras de filtro activas, enlaces CTA (`.cta-primary-button`), día actual en calendario, botón enviar saludo/comentario. |
| `muni-primary-a11y-800` | `#9a0101` | Texto oscuro de alto contraste sobre fondos institucionales suaves (`bg-muni-primary/10 text-muni-primary-a11y-800`, avatares institucionales, badges de categoría en noticias y tabs activas). |
| `muni-primary-700` | `#d90000` | Estado `:hover` de botones primarios (`hover:bg-muni-primary-700`) y enlaces CTA. |
| `muni-primary-900` | `#930909` | Cierre del gradiente institucional `.cta-bg` (`from-muni-primary to-muni-primary-900`) y estado descargado en Biblioteca. |
| `muni-primary-950` | `#510000` | Tinte profundo para fondos institucionales en modo oscuro. |
| `muni-primary-50` | `#fff0f0` | Fondos tenues de resaltado. |
| `muni-primary-100` | `#ffdcdc` | Subtítulos sobre cabeceras rojas y anillos suaves. |
| `muni-primary-200` | `#ffbfbf` | Indicadores inactivos del carrusel de noticias (`bg-muni-primary-200`). |
| `muni-primary-300` | `#ff9393` | **Equivalente en Modo Oscuro** para textos e iconos institucionales (`dark:text-muni-primary-300`) donde `#c30101` perdería contraste sobre `gray-900`. |
| `muni-primary-400`..`600` | `#ff5555`, `#ff2121`, `#ff0000` | Escala auxiliar de reserva. |
| `destacado` | `#fff1d2` | Crema cálido institucional para bloques destacados. |

### 2.2 Sub-Paleta Borgoña / Vino y `rose-*` (Aplicada en Componentes)

Esta combinación define la identidad visual del **Hero**, **Accesos Directos**, **Bienestar Social**, **Calendario** y **Teléfonos**:

| Color / Clase Aplicada | Modo Claro | Modo Oscuro (`dark:`) | Dónde se aplica en el proyecto |
|---|---|---|---|
| **Vino Institucional (`#8C1D28`)** | `text-[#8C1D28]` (o `/75`, `/80`) | `dark:text-rose-300` (o `/80`, `dark:text-rose-200`) | • Iconos de Accesos Directos y QuickStats en [HeroSection.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/home/HeroSection.jsx#L177-L299).<br>• Encabezados y viñetas en [Bienestar.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/pages/Bienestar.jsx#L220) y [ObjetivoValoresSection.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/bienestar/ObjetivoValoresSection.jsx#L126).<br>• Nombres de departamentos y anexos en [TelefonosModal.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/home/TelefonosModal.jsx#L584-L618). |
| **Botón Sólido Vino** | `bg-[#8C1D28] hover:bg-[#a5222f] text-white` | `dark:bg-rose-600 dark:hover:bg-rose-500` | Botón de descarga destacada ("Plan anual de beneficios") en [DocumentosSection.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/bienestar/DocumentosSection.jsx#L79). |
| **Vino Oscuro Agenda (`#6b151e`)** | `bg-red-50/80 text-[#6b151e] border-red-200/70` | `dark:bg-red-950/30 dark:text-red-200 dark:border-red-900/50` | Badge cuadrado de fecha (`14×14` / `16×16`) en tarjetas de Próximas Actividades ([CalendarSection.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/home/CalendarSection.jsx#L315)). |
| **Bordes Cálidos de Tarjetas Hero/Atajos** | `border-rose-200/80 hover:border-rose-300` | `dark:border-rose-900/50 dark:hover:border-rose-700/80` | Panel de bienvenida, tarjetas QuickStats, botones de Accesos Directos y tarjetas de Beneficios/Convenios. |
| **Superficie Cálida Suave** | `bg-rose-50/25` (reposo) / `hover:bg-rose-50/50` o `/70` | `dark:bg-gray-800/40` / `dark:hover:bg-rose-950/30` | Fondo de QuickStats, hover de Accesos Directos, fila destacada del Plan Anual y cumpleaños del día. |

### 2.3 Otros Colores Hexadecimales Específicos Aplicados

| Hex | Rol y Ubicación Exacta |
|---|---|
| `#C1272D` / hover `#9D1F26` | Fondo de `.btn-cta-solid` ([global.css](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/styles/global.css#L126-L128)): botón de conversión en `LiquidacionesModal` y `SolicitudesModal`. |
| `#e5f5ff` / `#b3e2ff` / `#d0edff` | Banner celeste de **Aviso Administrativo Importante** en [HeroSection.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/home/HeroSection.jsx#L140-L161) (`bg-[#e5f5ff] border-[#b3e2ff]`, botón cerrar `hover:bg-[#d0edff]`). |
| `#1877f2` (Light) / `#4f98a3` (Dark) | Anillo global `:focus-visible` en [accessibility.css](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/styles/accessibility.css#L22-L40), con halo interno `#ffffff` (claro) y `#1c1b19` (oscuro). |

### 2.4 Colores Semánticos, Estados y Avatares Deterministas

1. **Éxito / En Línea / Regalo / WhatsApp (`emerald-*` y `green-*`):**
   - Punto de estado "En línea" en avatar del Navbar: `bg-emerald-400 ring-2 ring-muni-primary`.
   - Confirmación de descarga/emisión ("Emitido", "Descargado", "Aprobada"): `text-emerald-600 dark:text-emerald-400`.
   - Badge "Regalo" en Marketplace: `bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200`.
   - Botón WhatsApp: `bg-emerald-600 hover:bg-emerald-700 text-white`.
   - Botón participativo "¡Me sumo! / Sumado" o "Entregado": `border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300`.
2. **Atención / Contadores / Importante / Permuta (`amber-*`):**
   - Badge numérico de notificaciones en Navbar y de cumpleaños en Accesos Directos: `rounded-full bg-amber-400 text-gray-950 text-[10px] font-bold tabular-nums`.
   - Icono de sol (conmutador Dark Mode): `text-amber-300`.
   - Badge "Importante" en Mural y "Permuta" en Marketplace: `bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200`.
   - Estado "En revisión" en Solicitudes: `text-amber-600 dark:text-amber-400`.
3. **Error / Restricción (`red-*` y `rose-*`):**
   - Callout `.restriccion`: `border-red-200 bg-red-50 text-red-800 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-200`.
   - Fallback de error de sección ([SectionErrorFallback.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/home/SectionErrorFallback.jsx)): contenedor `rounded-2xl border-rose-200/90 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20` con icono en `bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300`.
4. **Avatares Deterministas (`AVATAR_TONES` en [MuralComunitario.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/comunidad/MuralComunitario.jsx#L46-L65) y [marketplaceData.js](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/data/marketplaceData.js#L41-L60)):**
   Asigna un color consistente según la suma de códigos ASCII del nombre del funcionario:
   ```js
   const AVATAR_TONES = [
     'bg-teal-100 text-teal-900 dark:bg-teal-950/70 dark:text-teal-200',
     'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200',
     'bg-purple-100 text-purple-900 dark:bg-purple-950/70 dark:text-purple-200',
     'bg-orange-100 text-orange-900 dark:bg-orange-950/70 dark:text-orange-200',
     'bg-sky-100 text-sky-900 dark:bg-sky-950/70 dark:text-sky-200',
     'bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-200',
     'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200',
   ];
   export const toneFor = (name = '') =>
     AVATAR_TONES[[...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AVATAR_TONES.length];
   ```

---

## 3. Tipografía, Escalado y Jerarquía Semántica

- **Fuente única:** `"Open Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- **Tamaño base escalable:** `:root { --base-font-size: 16px; } html { font-size: var(--base-font-size); }`. Todas las medidas usan `rem` para soportar escalado de accesibilidad hasta `25px`.
- **Token tipográfico extra:** `--text-2xs: 0.7rem` (`11.2px`), usado en subtítulos uppercase de marca (`tracking-[0.18em]`), cabeceras de tablas/grupos y metadatos compactos. En badges muy pequeños (contadores o mes en calendario) se usa `text-[10px]` o `text-[11px]`.
- **Cifras alineadas (`tabular-nums`):** Obligatorio en fechas, horas, contadores de notificaciones/reacciones, precios en pesos (`$`), anexos telefónicos y saldos de días/horas.

### Jerarquía Tipográfica Aplicada

| Elemento / Rol | Clases Aplicadas |
|---|---|
| **Saludo Hero (`<h1>`) / Título de Página (`Bienestar`, `Comunidad`)** | `text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white` |
| **Sobretítulo (Eyebrow) en Hero / Comunidad** | `flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8C1D28]/80 dark:text-rose-300/80` |
| **Título de Sección (`.section-title`)** | `text-2xl font-semibold text-gray-900 dark:text-gray-100` |
| **Bajada de Sección (`.section-p`)** | `mt-2 max-w-2xl text-sm text-gray-600 lg:text-base dark:text-gray-300` |
| **Título de Tarjeta (`.card-titulo`)** | `mb-2.5 text-lg leading-tight font-semibold text-gray-900 transition-colors group-hover:text-muni-primary hover:text-muni-primary hover:underline dark:text-gray-100` |
| **Título de Modal (`<header> <h2>`)** | `text-base font-bold text-gray-900 dark:text-gray-100 truncate` |
| **Subtítulo de Grupo / Categoría en Modales** | `text-2xs font-semibold uppercase tracking-wider text-red-800 dark:text-rose-400` (o `text-muni-primary dark:text-muni-primary-300`) |
| **Cuerpo de lectura (`.contenido`)** | `text-xs leading-relaxed text-gray-700 md:text-sm dark:text-gray-300` |

---

## 4. Layout, Contenedor, Grillas y Ritmo Vertical

- **Contenedor Global (`@utility container`):**
  ```css
  @utility container {
    @apply mx-auto w-full max-w-full px-3 sm:max-w-3xl sm:px-6 lg:max-w-5xl lg:px-8 xl:max-w-7xl;
  }
  ```
- **Breakpoints:** `xs: 475px`, `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`, `3xl: 120rem (1920px)`.
- **Estructura de Vista Estándar (`src/pages/*.jsx`):**
  ```jsx
  <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
    {/* 1. Skip link accesible */}
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow-lg">
      Saltar al contenido principal
    </a>
    {/* 2. Navbar sticky */}
    <Navbar ... />
    {/* 3. Main */}
    <main id="main-content" className="flex-1">
      <HeroSection ... />
      {/* 4. Transición suave solo para el contenido bajo el Hero (evita parpadeo) */}
      <div className="page-content-transition">
        {/* Secciones */}
      </div>
    </main>
    {/* 5. Footer siempre oscuro */}
    <Footer ... />
    {/* 6. Modales nativos <dialog> montados al nivel raíz */}
  </div>
  ```
- **Alternancia de Fondos de Sección:**
  - Sección 1 (Hero): `bg-white dark:bg-gray-950 border-b border-gray-300 dark:border-gray-800 pb-10 md:pb-12`
  - Sección 2 (Calendario / Contenido interior): `py-10 md:py-12 bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800`
  - Footer: `bg-gray-950 text-gray-100 print:hidden`
- **Grillas Canónicas:**
  - **Hero + Accesos Directos / Calendario + Agenda:** `grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch` (2 columnas de `lg:col-span-6`).
  - **Matriz de 8 Accesos Directos:** `grid grid-cols-2 sm:grid-cols-4 grid-rows-4 sm:grid-rows-2 gap-2.5 sm:gap-3 h-full`.
  - **Mural Comunitario / Marketplace / Noticias:** `grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5` (o `gap-6`).
  - **Pasos de Incorporación (Bienestar):** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5`.

---

## 5. Anatomía Detallada de Componentes y Patrones UI/UX

### 5.1 Navbar Institucional ([Navbar.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/home/Navbar.jsx))
- **Contenedor:** `<header className="sticky top-0 z-40 transition-shadow duration-200 print:hidden cta-bg border-b border-white/10">` con `shadow-lg` cuando `window.scrollY > 16`.
- **Identidad izquierda:** Logo blanco (`h-8 sm:h-9`) + separador vertical `h-8 w-px bg-white/30` + doble línea (`text-2xs uppercase tracking-[0.18em] text-white/70` + `text-base font-semibold text-white`).
- **Botones de acción derecha:** Circulares `min-w-10 min-h-10 rounded-full text-white/90 hover:text-white hover:bg-white/15`.
- **Avatar de usuario:** `h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/20 hover:bg-white/30 border border-white/35 text-white font-bold` con indicador verde `h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-muni-primary`.
- **Popovers (Notificaciones / Perfil):** `absolute right-0 mt-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150`. Se cierran al hacer clic fuera (`mousedown`) o presionar `Escape`.

### 5.2 Tarjeta Hero y Accesos Directos ([HeroSection.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/home/HeroSection.jsx))
- **Tarjeta de Bienvenida:** `rounded-xl bg-white dark:bg-gray-900 border border-rose-200/80 dark:border-rose-900/50 p-6 sm:p-7 shadow-md shadow-gray-200/70 dark:shadow-black/40`.
- **Tarjetas QuickStats (3 columnas):**
  ```html
  rounded-lg bg-rose-50/25 dark:bg-gray-800/40 border border-rose-200/80 dark:border-rose-900/50 p-2.5 text-left shadow-xs transition-all hover:shadow-sm hover:border-rose-300 hover:bg-rose-50/70 dark:hover:border-rose-800 dark:hover:bg-rose-950/30
  ```
- **Botones de Accesos Directos:**
  ```html
  group flex flex-col items-center justify-center w-full h-full cursor-pointer rounded-xl border p-2.5 sm:p-3 text-center shadow-md shadow-gray-200/70 dark:shadow-black/40 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] bg-white dark:bg-gray-900 border-rose-200/80 dark:border-rose-900/50 text-gray-800 dark:text-gray-200 hover:border-rose-300 hover:bg-rose-50/50 hover:text-[#8C1D28] dark:hover:border-rose-700/80 dark:hover:bg-rose-950/30 dark:hover:text-rose-200
  ```
  - Icono interno (`SolidIcons`): `h-6 w-6 sm:h-7 sm:w-7 text-[#8C1D28]/75 dark:text-rose-300/80 group-hover:text-[#8C1D28] dark:group-hover:text-rose-200` con contenedor `group-hover:scale-110`.

### 5.3 Ventanas Modales Canónicas (`<dialog>` Nativo HTML5)
Todos los modales del proyecto utilizan el elemento nativo `<dialog>` sincronizado con `showModal()` y `close()`, obteniendo *focus trap*, cierre con `Escape` y `::backdrop` nativo:
- **Clases del `<dialog>`:**
  ```html
  m-auto w-[min(92vw,48rem)] h-[88vh] max-h-[88vh] overflow-hidden rounded-2xl bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-black/50 dark:bg-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800
  ```
  *(Variantes de ancho: `56rem` para modales de 2 columnas como `TelefonosModal`; `36rem`–`38rem` para formularios/detalle de Marketplace).*
- **Cierre al hacer clic en el backdrop:**
  ```jsx
  onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  ```
- **Cabecera Canónica de Modal (`<header>`):**
  ```jsx
  <header className="flex items-center justify-between border-b border-gray-100 px-6 sm:px-8 py-5 sm:py-6 dark:border-gray-800 shrink-0 gap-4">
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muni-primary/10 text-muni-primary dark:bg-muni-primary/20 dark:text-muni-primary-300">
        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <h2 id="modal-title" className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">Título</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Subtítulo descriptivo</p>
      </div>
    </div>
    <button type="button" onClick={onClose} aria-label="Cerrar modal" className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors">
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  </header>
  ```
- **Cuerpo Scrolleable:** `flex-1 overflow-y-auto px-6 sm:px-8 py-4 sm:py-5` (gracias a `dialog .overflow-y-auto { overscroll-behavior-y: contain; }` y `body:has(dialog[open]) { overflow: hidden; }`).
- **Pie Canónico de Modal (`<footer>`):**
  ```jsx
  <footer className="border-t border-gray-100 px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-end dark:border-gray-800 shrink-0">
    <button type="button" onClick={onClose} className="btn-gris py-1! px-3! text-xs font-semibold cursor-pointer">
      Cerrar
    </button>
  </footer>
  ```

### 5.4 Los 3 Patrones de Pestañas (Tabs) y Filtros
1. **Pestañas de Navegación de Vista (Subrayado inferior en `Bienestar` y `Comunidad`):**
   - Contenedor: `border-b border-gray-200 dark:border-gray-800` con `role="tablist"` y navegación por teclado (`ArrowLeft`, `ArrowRight`, `Home`, `End`).
   - Botón `role="tab"`:
     - **Activo:** `border-b-2 border-muni-primary text-muni-primary-a11y dark:border-rose-400 dark:text-rose-300 font-bold`
     - **Inactivo:** `border-b-2 border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 font-semibold`
   - **Técnica de altura armonizada ([Bienestar.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/pages/Bienestar.jsx#L278-L326)):** Apilar paneles en la misma celda de CSS Grid (`col-start-1 row-start-1`) alternando `opacity-100 visible` vs `opacity-0 invisible pointer-events-none select-none` para evitar saltos de altura al cambiar de pestaña.
2. **Pestañas Internas de Modal ([DatosPersonalesModal.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/home/DatosPersonalesModal.jsx#L157-L193)):**
   - Barra contenedora: `border-b border-gray-100 bg-gray-50/60 px-6 sm:px-8 py-3.5 dark:border-gray-800 dark:bg-gray-950/40`.
   - Tab activa: `rounded-lg px-3 py-1.5 text-xs font-semibold bg-muni-primary/10 text-muni-primary-a11y-800 border border-muni-primary/30 shadow-xs dark:bg-muni-primary/25 dark:text-red-100 dark:border-muni-primary/50`.
3. **Píldoras de Filtro con Contador ([MuralComunitario.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/comunidad/MuralComunitario.jsx#L900-L922), [MarketplaceSection.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/comunidad/MarketplaceSection.jsx#L97-L118)):**
   - Activa: `min-h-9 rounded-full border px-3.5 text-xs font-semibold border-muni-primary-a11y bg-muni-primary-a11y text-white`.
   - Inactiva: `border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800`.

### 5.5 Calendario Interactivo y Agenda ([CalendarSection.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/home/CalendarSection.jsx))
- **Grilla Mensual:** 7 columnas × 6 filas fijas (`grid-cols-7 grid-rows-6`, 42 celdas) alineada de Lunes a Domingo (`(firstDay.getDay() + 6) % 7`).
- **Estados de celda (`h-7 w-7 sm:h-8 sm:w-8 rounded-full text-xs tabular-nums`):**
  - **Hoy:** `bg-muni-primary-a11y font-bold text-white shadow-xs`
  - **Con evento próximo/vigente:** `bg-red-50/80 font-semibold text-[#8C1D28] border border-red-200/80 hover:bg-red-100/70 dark:bg-rose-950/30 dark:text-rose-200 dark:border-rose-900/50 cursor-pointer`
  - **Con evento pasado:** `bg-slate-100/90 font-medium text-slate-500 border border-slate-200/90 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/80 cursor-pointer`
  - **Día normal sin evento:** `text-gray-700 dark:text-gray-300 cursor-default select-none`
- **Sincronización con Agenda:** Hacer clic en un día con evento desplaza suavemente (`scrollTo({ behavior: 'smooth' })`) la lista de actividades hasta el primer evento de ese día (`data-day`). Si hay más de 3 eventos en el mes, la lista activa `max-h-80 overflow-y-auto scrollbar-thin`.

### 5.6 Carrusel de Noticias Accesible ([NoticiasCarousel.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/home/NoticiasCarousel.jsx))
- **Fallback sin carrusel:** Si `posts.length <= 2`, renderiza una grilla estática `grid grid-cols-1 gap-6 md:grid-cols-2`.
- **Sincronización A11y (`syncSlidesA11y`):** Aplica `aria-hidden="true"` e `inert=""` a todo slide fuera de vista o duplicado por `loop`.
- **Controles inferiores:**
  - Cápsula izquierda (`rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-1.5 shadow-sm`) con botón **Pausa/Reproducir** + indicadores tipo píldora (`h-2 rounded-full`: activo `w-6 bg-muni-primary dark:bg-white`, inactivo `w-2 bg-muni-primary-200 dark:bg-gray-600`).
  - Botones de flecha derecha: `min-w-11 min-h-11` (`44×44px`) circulares con hover en `muni-primary`.

### 5.7 Skeletons y Prevención de Flash Falso ([HomeSkeletons.jsx](file:///C:/Joaquin/2.Trabajo/Municipalidad%20Rancagua/intranet-rancagua/src/components/home/HomeSkeletons.jsx))
- Cada sección asíncrona tiene su Skeleton simétrico con `animate-pulse` (`HeroSectionSkeleton`, `QuickStatSkeleton`, `CalendarSectionSkeleton`, `NewsSectionSkeleton`) usando `bg-gray-200 dark:bg-gray-800`.
- **Regla anti-falso cero:** Nunca mostrar `0` mientras carga una métrica (como cumpleaños del día); ocultar el badge o renderizar el skeleton hasta que finalice la petición o se hidrate desde `sessionStorage`.

---

## 6. Hojas de Estilo Base Listas para Copiar a Otro Proyecto

### 6.1 `src/styles/accessibility.css`

```css
/* ==========================================================================
   Accesibilidad Global — Municipalidad de Rancagua (WCAG 2.1 AA / 2.2)
   ========================================================================== */

:root {
  --base-font-size: 16px;
}

html {
  font-size: var(--base-font-size);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 1. Resetear outline por defecto en mouse/touch */
*:focus {
  outline: none;
}

/* 2. Anillo bicolor global para navegación por teclado (WCAG 2.2 SC 2.4.11)
      Visible sobre fondos blancos, grises oscuros y rojos institucionales */
*:focus-visible {
  outline: 1.5px solid #1877f2;
  outline-offset: 1.5px;
  border-radius: 3px;
  box-shadow: 0 0 0 1px #ffffff, 0 0 0 4px #1877f2;
  transition: outline-offset 0.1s ease, box-shadow 0.1s ease;
}

button:focus-visible,
[role="button"]:focus-visible {
  outline-color: #1877f2;
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #1877f2;
}

.dark *:focus-visible,
[data-theme="dark"] *:focus-visible {
  outline-color: #4f98a3;
  box-shadow: 0 0 0 1px #1c1b19, 0 0 0 3px #4f98a3;
}

/* 3. Soporte Windows High Contrast / Forced Colors */
@media (forced-colors: active) {
  *:focus-visible {
    outline: 3px solid ButtonText;
    outline-offset: 3px;
    box-shadow: none;
  }
}

/* 4. Respeto global a movimiento reducido */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* 5. Utilidad solo para lectores de pantalla */
.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}
```

### 6.2 `src/styles/global.css`

```css
/* Estilos Globales — Intranet Municipalidad de Rancagua */
@import url("https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap");
@import "tailwindcss";
@import "./accessibility.css";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans:
    "Open Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, sans-serif;

  /* Paleta Institucional Municipalidad de Rancagua */
  --color-muni-primary: #c30101;
  --color-muni-primary-a11y: #ae0101;
  --color-muni-primary-a11y-800: #9a0101;
  --color-muni-primary-50: #fff0f0;
  --color-muni-primary-100: #ffdcdc;
  --color-muni-primary-200: #ffbfbf;
  --color-muni-primary-300: #ff9393;
  --color-muni-primary-400: #ff5555;
  --color-muni-primary-500: #ff2121;
  --color-muni-primary-600: #ff0000;
  --color-muni-primary-700: #d90000;
  --color-muni-primary-900: #930909;
  --color-muni-primary-950: #510000;
  --color-destacado: #fff1d2;

  /* Breakpoints extendidos */
  --breakpoint-xs: 475px;
  --breakpoint-3xl: 120rem;

  /* Espaciado y tipografía custom */
  --spacing-113: 28.25rem;
  --text-2xs: 0.7rem;
}

@layer base {
  body {
    margin: 0;
    padding: 0;
  }

  body:has(dialog[open]) {
    overflow: hidden;
  }
}

@layer components {
  dialog .overflow-y-auto {
    overscroll-behavior-y: contain;
  }

  /* Layout y Contenedores Canónicos */
  .section-padding {
    @apply py-12 md:pt-14 md:pb-16;
  }

  .inner-padding {
    @apply pt-3 pb-10;
  }

  .inner-header {
    @apply pb-6;
  }

  /* Jerarquía Tipográfica Semántica */
  .inner-title {
    @apply mb-2 text-xl font-semibold text-gray-900 lg:text-2xl dark:text-gray-100;
  }

  .section-title {
    @apply text-2xl font-semibold text-gray-900 dark:text-gray-100;
  }

  .titulo {
    @apply text-xl font-semibold text-gray-900 dark:text-white;
  }

  .card-titulo {
    @apply mb-2.5 text-lg leading-tight font-semibold text-gray-900 transition-colors group-hover:text-muni-primary hover:text-muni-primary hover:underline dark:text-gray-100;
  }

  .subtitulo {
    @apply text-base font-medium text-gray-900 md:text-lg dark:text-gray-200;
  }

  .titulo-sm {
    @apply text-sm font-medium text-gray-800 dark:text-gray-200;
  }

  .section-p {
    @apply mt-2 max-w-2xl text-sm text-gray-600 lg:text-base dark:text-gray-300;
  }

  .contenido {
    @apply text-xs leading-relaxed text-gray-700 md:text-sm dark:text-gray-300;
  }

  .nota {
    @apply text-xs font-semibold text-gray-700 dark:text-gray-300;
  }

  .badge {
    @apply rounded-xl bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 md:rounded-3xl dark:bg-gray-800 dark:text-gray-300;
  }

  .enlace-texto {
    @apply transition-all ease-in-out group-hover:text-muni-primary group-hover:underline hover:text-muni-primary hover:underline;
  }

  /* Botones y Acciones Clicables */
  .btn-primario-solid {
    @apply inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-muni-primary-a11y px-6 py-3 text-sm font-semibold text-white transition hover:bg-muni-primary-700;
  }

  .btn-cta-solid {
    @apply flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#C1272D] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#9D1F26];
  }

  .btn-descargar-icon-solid {
    @apply inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-muni-primary px-3 py-2 text-sm text-white transition-colors hover:bg-muni-primary/90;
  }

  .btn-gris {
    @apply inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900! dark:text-gray-300 dark:hover:bg-gray-800;
  }

  .btn-gris-xl {
    @apply inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800;
  }

  .btn-abrir {
    @apply inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm whitespace-nowrap text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700;
  }

  .cta-primary-button {
    @apply inline-flex cursor-pointer items-center gap-1.5 rounded-lg py-2 text-sm font-medium text-muni-primary-a11y underline transition-all duration-200 ease-in-out hover:text-muni-primary-700 dark:text-gray-300 dark:hover:text-white;
  }

  /* Tarjetas, Contenedores y Callouts Semánticos */
  .card {
    @apply rounded-xl border border-gray-200 bg-white shadow-sm transition-all ease-in-out hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600;
  }

  .card-selected {
    @apply border-muni-primary/30! bg-white! text-muni-primary! shadow-sm! dark:bg-gray-900!;
  }

  .card-importante {
    @apply rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-700/40 dark:bg-amber-700/10;
  }

  .destacado {
    @apply rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:border-amber-700/40 dark:bg-amber-700/10 dark:text-amber-100;
  }

  .restriccion {
    @apply rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-200;
  }

  .informacion {
    @apply rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900 dark:border-blue-800/40 dark:bg-blue-900/20 dark:text-blue-100;
  }

  .item-destacado {
    @apply rounded-xl border border-muni-primary/20 bg-muni-primary/10 px-3 py-2 shadow-sm transition-all duration-200;
  }

  .detalles-card-items-bg {
    @apply flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/40;
  }

  .list-item {
    @apply rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60!;
  }

  /* Inputs y Formularios */
  .search-input {
    @apply w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 transition-all focus:border-muni-primary focus:ring-2 focus:ring-muni-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400;
  }

  .search-filter {
    @apply rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-muni-primary focus:ring-2 focus:ring-muni-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200;
  }

  /* Gradientes Institucionales */
  .bg-navbar {
    @apply bg-linear-to-b from-muni-primary to-muni-primary-a11y dark:from-gray-950 dark:to-gray-900;
  }

  .cta-bg {
    @apply bg-linear-to-r from-muni-primary to-muni-primary-900 dark:from-gray-800 dark:to-gray-900;
  }

  .cta-bg-gris {
    @apply bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50;
  }
}

@utility container {
  @apply mx-auto w-full max-w-full px-3 sm:max-w-3xl sm:px-6 lg:max-w-5xl lg:px-8 xl:max-w-7xl;
}

@utility scrollbar-thin {
  scrollbar-width: thin;
}

@utility scrollbar-none {
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

@keyframes pageContentFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-content-transition {
  animation: pageContentFadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  .page-content-transition {
    animation: none;
  }
}

@media print {
  @page {
    size: A4;
    margin: 0.5cm;
  }

  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
```

