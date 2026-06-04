# Portal ENCOSEP — Módulo de EXPEDIENTES (flujo administrativo formal)

> Fecha: 03/06/2026 · Estado: **especificación aprobada, a implementar por fases**
> Origen: cuando el Ente eleva un reclamo a expediente, arranca este trámite formal.

---

## 0. Regla de oro (igual que el resto)
- **Aditivo, no destructivo.** Reutilizar lo que ya existe (`Expediente`, `ActoAdministrativo`,
  `TipoActo`, `Inspeccion`) y sumar campos/tipos nuevos sin romper nada.
- El **usuario (reclamante) y la prestadora** ven el expediente, pero **no modifican** nada;
  solo pueden **agregar cuando AMPLÍAN o solicitan ampliar**.

---

## 1. Carátula (al elevar a expediente)

La carátula se arma automáticamente con:
- **Tipo de expediente**
- **Nombre del reclamante**
- **Interviniente(s)**
- **Prestadora**
- **Objeto** del expediente
- **Logo ENCOSEP**

> Modelo: `Expediente.caratula` ya existe (texto). **Falta (aditivo):** `tipoExpediente`,
> y registrar **intervinientes** (campo/relación nueva). El reclamante sale del reclamo
> vinculado; la prestadora ya está en `Expediente.prestadoraId`.

## 2. Etapas del expediente (línea de tiempo de actos)

Cada etapa es un **acto** (`ActoAdministrativo`) en la línea de tiempo. Cada una **emite un
documento** y puede llevar **adjuntos** (documentación, videos, imágenes, sonidos).

| # | Etapa | Quién | Notas |
|---|---|---|---|
| 1 | **Carátula** | Ente | Se arma con los datos del punto 1 + logo |
| 2 | **Acta de recepción del reclamo** | Ente | Deja **constancia de la pretensión, el reclamo y la documental** (hechos y circunstancias). Adjunta documentación/videos/imágenes/sonidos |
| 3 | **Notificar a la prestadora** | Ente | La prestadora "recibe" el expediente; se otorga **plazo para responder** (asignable manualmente). La prestadora pasa a **ver todo** |
| 4 | **Contestación de la prestadora** | Prestadora | Responde y **agrega documental** / cualquier archivo |
| 5 | **Actos del Ente (en cualquier momento)** | Ente | ver abajo |
| 6 | **Resolución** | Ente | Pone fin (ver punto 4) |
| 7 | **Archivo / Cierre de actuaciones** | Ente | Tras resolver |

### Actos del Ente disponibles en cualquier momento (punto 5)
- **Solicitar ampliación** (al reclamante o a la prestadora)
- **Agregar acta de constatación**
- **Vincular con una inspección** → poder **abrir y ver lo observado** (usa `Inspeccion`)
- **Disposición** (= **proveído simple**, acto de **mero trámite** que **ordena el proceso**;
  **admite VARIAS** a lo largo del expediente): notifica a las partes, deja constancia de la
  **prueba analizada** y el **derecho** que asiste. Puede **adjuntar documental** y una
  **normativa con link**.
- **Resolución**: pone fin.

## 3. Notificación y visibilidad

- El **usuario, la prestadora y los intervinientes** pueden **ver todo el expediente**.
- Pero cada **disposición o resolución** se comunica **solo al apretar el botón "Notificar"**.
- Todas las etapas se **notifican al usuario**. El usuario **no modifica** nada; solo puede
  **agregar** cuando **amplía** o **solicita ampliar**.

## 4. Resolución (pone fin)

- Fundamenta: **hecho, derecho y la pretensión**.
- Se puede **notificar a**: prestadora · **Autoridad de Aplicación** · **Poder Ejecutivo (PEM)**
  · **Concejo Deliberante**. (Botón de notificación por destinatario.)

## 5. Documentos

- **Cada etapa emite un documento** (acto → documento descargable).
- Botón para **emitir el documento del EXPEDIENTE COMPLETO** (todos los actos en un solo archivo).

> El proyecto ya genera `.docx` (informes mensuales/anuales, actas de inspección). Se reutiliza
> esa capacidad para los documentos de actos y del expediente completo.

---

## 6. Mapa técnico — qué ya existe y qué falta (aditivo)

### Ya existe
- `Expediente` (numero, caratula, asunto, prestadoraId, estado [ABIERTO/EN_TRAMITE/RESUELTO/ARCHIVADO], iniciadorId, reclamos[], actos[], inspecciones[]).
- `ActoAdministrativo` (expedienteId, tipo, titulo, cuerpo, autorId, createdAt).
- `TipoActo`: CARATULACION, NOTIFICACION, INTIMACION, DESCARGO_PRESTADORA, RESOLUCION, CIERRE, NOTA.
- `Inspeccion` (vinculable al expediente).
- Generación de `.docx`.

### Falta (todo aditivo)
- **`TipoActo`** nuevos valores: `ACTA_RECEPCION`, `DISPOSICION`, `ACTA_CONSTATACION`, `AMPLIACION`, `SOLICITUD_AMPLIACION`.
- **Adjuntos de acto**: modelo nuevo `ActoAdjunto` (url, tipo: imagen/video/audio/documento) — hoy el acto solo tiene texto.
- **`Expediente.tipoExpediente`** (campo nuevo) y **intervinientes** (relación/campo nuevo).
- **Plazo a la prestadora**: campo en el acto NOTIFICACION o en `Expediente` (ej. `plazoRespuestaHasta`).
- **Notificación por botón**: en `ActoAdministrativo`, campos `notificadoEn`, `notificadoA[]` (destinatarios) → la disposición/resolución no se comunica hasta apretar "Notificar".
- **Visibilidad prestadora/usuario/intervinientes** del expediente (acceso de lectura controlado por rol/relación).
- **Generador de documento** por acto y del **expediente completo** (.docx/.pdf con logo).
- **Normativa con link** en disposiciones (campo url + descripción).

---

## 7. Plan por fases (sin romper nada)

- **F-A · Carátula enriquecida**: `tipoExpediente` + intervinientes + carátula armada con logo.
- **F-B · Actos con adjuntos**: modelo `ActoAdjunto` + tipos de acto nuevos (acta de recepción, disposición, acta de constatación, ampliación).
- **F-C · Notificación por botón**: `notificadoEn`/`notificadoA`, plazo a la prestadora, vista de la prestadora del expediente.
- **F-D · Resolución y cierre**: resolución con notificación a múltiples destinatarios (prestadora/AA/PEM/Concejo), archivo/cierre.
- **F-E · Documentos**: emitir documento por acto y del expediente completo.
- **F-F · Vista del usuario y prestadora**: ver todo (solo lectura) + ampliar/solicitar ampliación.

Cada fase se prueba (tsc) y se publica antes de la siguiente.

## 9. UI del expediente — pantalla de trabajo (3 zonas)

```
┌──────────────┬───────────────────────────────────┬──────────────┐
│ HOJA DE RUTA │        MESA DE TRABAJO            │  CHAT con el │
│  (vertical)  │        (horizontal, amplia)       │   usuario    │
│              │                                   │              │
│ ● Carátula   │  [ contenido de la etapa elegida: │  Vecino: ... │
│ ● Acta recep.│    texto del acto, adjuntos,      │  ENCOSEP:... │
│ ◉ Notif. pr. │    botones de notificar, emitir   │  [responder] │
│ ○ Contesta   │    documento, etc. ]              │              │
│ ○ Disposición│                                   │              │
│ ○ Resolución │                                   │              │
│ ○ Archivo    │                                   │              │
└──────────────┴───────────────────────────────────┴──────────────┘
```

1) **Hoja de ruta (columna vertical):** muestra **en qué etapa está** el expediente. Lista las
   etapas con su estado (hecho ● / en curso ◉ / pendiente ○) y sirve de **navegación**: al
   clickear una etapa se abre su contenido en la mesa de trabajo. Es el "dónde estoy" de un vistazo.

2) **Mesa de trabajo (área central horizontal, amplia):** donde realmente **se trabaja** la etapa
   elegida: ver/redactar el acto, **cargar documental** (imágenes, videos, sonidos), botones de
   **Notificar** y **Emitir documento**. Es la zona grande, cómoda para operar.

3) **Chat con el usuario:** comunicación con el reclamante dentro del expediente (mismo patrón de
   ida y vuelta que ya hicimos en el reclamo: mensajes visibles + responder).

> Etapas fijas de la hoja de ruta:
> **Carátula → Acta de recepción → Notificación prestadora → Contestación prestadora → Disposición
> → Resolución → Archivo/Cierre.**
> Los **actos eventuales** (acta de constatación · vincular inspección · solicitar/ampliación) no
> son pasos fijos: se intercalan y quedan listados en la etapa donde correspondan + en el documento
> del expediente completo.

## 8. Decisiones abiertas
- [ ] Lista de **tipos de expediente** (¿catálogo fijo? ej.: "Reclamo individual", "De oficio", "Colectivo").
- [ ] ¿"Intervinientes" se cargan a mano o se derivan (reclamante + prestadora + AA)?
- [ ] Formato del documento: ¿.docx, .pdf, o ambos?
- [ ] ¿El plazo a la prestadora dispara algún aviso/vencimiento (reutilizar `Vencimiento`)?
