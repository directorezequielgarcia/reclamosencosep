# Portal de Reclamos ENCOSEP — Experiencia del RECLAMANTE (registro, carga y seguimiento)

> Fecha: 03/06/2026 · Estado: **aprobado para implementar** (con plan por fases)
> Alcance: mejorar la experiencia del **reclamante** (vecino). NO toca el panel de gestores.

---

## 0. ALCANCE Y REGLA DE ORO (no romper nada)

- Todo esto aplica **solo al RECLAMANTE** = usuario con rol **`CIUDADANO`**.
- **NO se modifican** las relaciones/vinculaciones ni los flujos de los **gestores**
  (`GESTOR_ENTE`, `OPERADOR_PRESTADORA`, `DIRECTOR`, `EXPEDIENTES`, `INSPECCIONES`,
  `AUDIENCIAS_MEDIOS`, `SUPER_ADMIN`, `AUDITOR`): siguen con sus **usuarios y claves**
  actuales y el panel admin tal como está.
- **NO se rompe** el modelo de datos existente. Los cambios de schema permitidos son
  **solo aditivos** (campos nuevos opcionales / con default), nunca renombres ni borrados.
- Reutilizamos lo que ya existe: `ReclamoEvento` (hilo), `Adjunto` (fotos/archivos),
  `ReclamoEstado` (permisos por estado).

---

## 0.bis Pantalla de entrada — "¿Quién sos hoy?"

Puerta de entrada al portal: el visitante elige su perfil y lo llevamos al flujo correcto.

| Botón | Quién es | A dónde va |
|---|---|---|
| **USUARIO** | Vecino / reclamante | Registro/login **nombre + DNI** → flujo de reclamos |
| **Team EnCoSep** | Personal del Ente | Login usuario+clave → panel admin según su rol interno (`GESTOR_ENTE`, `EXPEDIENTES`, `INSPECCIONES`, `AUDIENCIAS_MEDIOS`, `COOPERATIVA_DOCS`, `DIRECTOR`) |
| **PRESTADORA** | Operador de la empresa | Login usuario+clave (`OPERADOR_PRESTADORA`) → su bandeja |
| **AUTORIDAD DE APLICACIÓN** | (antes "Secretaría") | Login usuario+clave (rol a definir) |
| **PEM** | Poder Ejecutivo Municipal — **Secretario de Gobierno** (máximo referente) | Login usuario+clave → panel institucional |
| **CONCEJO DELIBERANTE** | **Presidente del Concejo y concejales** | Login usuario+clave → panel institucional |

> ⚠️ **Seguridad — la elección ORIENTA, no AUTORIZA.** Elegir "PEM" o "PRESTADORA" solo
> decide a qué formulario y a qué marca/branding va el visitante. El acceso real y los
> permisos los sigue dando el **rol del usuario autenticado**. Un vecino que elija "PEM"
> no entra sin las credenciales de PEM. (Si no, sería un agujero de seguridad.)

> Roles nuevos (PEM, CONCEJO_DELIBERANTE, AUTORIDAD_APLICACION): si se adoptan, se
> agregan como valores **aditivos** al enum `Rol`. No alteran los roles ni vínculos existentes.

### 0.ter Perfiles institucionales — qué pueden hacer (PEM, Concejo, Autoridad de Aplicación)

- **PEM** (Secretario de Gobierno) y **CONCEJO DELIBERANTE** (Presidente + concejales)
  → **mismo panel y mismas capacidades** (tabla de abajo).
- **AUTORIDAD DE APLICACIÓN** (reemplaza a "Secretaría") → **panel propio, más operativo** (ver más abajo).

### PEM + Concejo Deliberante (panel institucional de consulta)
Lectura + canales formales. Capacidades:

| Capacidad | Estado | Base |
|---|---|---|
| **Presentar nota** al ENCOSEP (escrito formal) | NUEVO | modelo nuevo aditivo (tipo "Nota institucional") |
| **Solicitar asistencia técnica** | NUEVO | idem (tipo de solicitud) |
| **Agenda**: ver audiencias existentes **+ solicitar una agenda/reunión con un motivo** | Reusar + NUEVO | `AudienciaPublica` + solicitud nueva (aditivo) |
| **Reportes de indicadores** | Reusar | `(sitio)/indicadores` |
| **Encuestas de satisfacción** | Reusar | `EncuestaServicios`, `(sitio)/encuesta` |
| **Problemas por barrio y por servicio** | Reusar/derivar | reclamos agregados por `barrio` + `servicio` |
| **Repositorio normativo único por servicio concesionado** (agua, energía, residuos, transporte) | NUEVO/ampliar | ampliar `(sitio)/areas-fiscalizadas/[svc]` |

> Idea fuerza: que el referente institucional tenga **en un solo lugar** los reportes
> (indicadores, encuestas, problemas por barrio/servicio) **y** toda la **normativa que
> reglamenta cada servicio concesionado**, más los canales para **presentar nota** y
> **solicitar asistencia técnica**.

### Autoridad de Aplicación — panel propio (más operativo)

El ENCOSEP **fiscaliza y recomienda**; la **Autoridad de Aplicación aplica las sanciones**.
Su panel (distinto del de PEM/Concejo):
- **Ver los expedientes** que arma el ENCOSEP.
- **Mensajería** (una parte) con el ENCOSEP.
- **Reclamos derivados por falta de constatación de la prestadora**.
- **Agendas de trabajo**.
- **Ver las recomendaciones de aplicación de sanciones** que emite el ENCOSEP.

> A confirmar contra la normativa el vínculo ENCOSEP ↔ Autoridad de Aplicación
> (Ord. 13.189/17 + marco regulatorio de cada servicio) para fijar exactamente qué ve y qué puede.

**Autoridades de aplicación por servicio (según normativa municipal vigente — investigado 03/06/2026):**

| Servicio | Concesionaria | Autoridad de Aplicación |
|---|---|---|
| Higiene urbana / residuos (RSU) | Urbana (CLEAR URBANA) | **UGEM** — Unidad de Gestión Municipal (Ord. 11638/14; pliego Ord. 11728) |
| Agua, cloacas, energía | SCPL | **Subsecretaría de Redes y Servicios Públicos** |
| Transporte urbano de pasajeros | Patagonia Argentina / Diadema | **Secretaría de Gobierno** (vía **Subsecretaría de Transporte**) |
| Control transversal de todos | — | **ENCOSEP** — ente de control (Ord. 13.189/17) |

**Esquema clave:** el **ENCOSEP fiscaliza y *recomienda*** la sanción; la **autoridad de
aplicación de cada servicio la *aplica*** (multa, apercibimiento).

→ **Implicancia para la app:** el rol `AUTORIDAD_APLICACION` debe **vincularse a un servicio**
(igual que `OPERADOR_PRESTADORA` se vincula a una prestadora), para que cada autoridad vea
**solo lo de su servicio**. Hay varias autoridades, no una sola.

> Pendiente fino: leer Ord. 13.189/17 y los pliegos de cada servicio para el detalle del
> régimen sancionatorio (qué recomienda el Ente y qué resuelve cada autoridad).

**Doble perfil del Secretario de Gobierno (RESUELTO):** es a la vez referente del **PEM**
(consulta institucional) y **autoridad de aplicación del transporte** (operativo). Se le da
**un único acceso que combina ambos paneles** (consulta PEM/Concejo + bandeja de la Autoridad
de Aplicación de Transporte). Técnicamente: rol institucional + vínculo al servicio Transporte
como autoridad de aplicación (campos aditivos en `Usuario`, no rompen el modelo).

Decisiones abiertas (institucional):
- [x] "Presentar nota" / "asistencia técnica": **solo institucionales** (PEM/Concejo/Aut. de Aplicación). **Prestadoras NO por ahora.**
- [x] "Agenda" = ver audiencias existentes **+ solicitar una agenda/reunión con motivo** (resuelto).
- [ ] Alcance del repositorio normativo: qué normas por servicio (ordenanzas, pliegos, marcos regulatorios).
- [ ] Confirmar el vínculo ENCOSEP ↔ Autoridad de Aplicación según la normativa (Ord. 13.189/17).

## 1. Creación de usuario (reclamante)

| Campo | Obligatorio | Notas |
|---|---|---|
| Nombre y apellido | Sí | — |
| DNI | Sí | Es también la **contraseña inicial** |

- Con esos dos datos se crea la cuenta (rol `CIUDADANO`) y entra.
- **La contraseña inicial es el DNI.** Adentro puede cambiarla (ya existe `mi-cuenta`).
- Mitigación (recomendada, sin fricción): en el primer ingreso, aviso
  "Te recomendamos cambiar tu contraseña" con el botón al lado.

> Gestores: se crean desde `admin/usuarios/crear` con su rol y clave. **Sin cambios.**

## 2. Primer ingreso — datos de contacto

Mensaje + formulario antes de operar:

> **Necesitamos algunos datos para gestionar tu reclamo.**
> Con ellos vamos a poder **notificarte los cambios de tu reclamo, el avance del
> expediente, los pasos y la resolución.**
> - 📱 Celular / WhatsApp *(opcional)*  ·  ✉️ Email *(opcional)*  ·  🏠 Domicilio *(opcional)*
>
> ⚠️ Dejanos **al menos uno: celular o email** (es la vía por la que te avisamos).
> Tus datos se usan solo para tu reclamo (Ley 25.326).

Validación: celular y email opcionales pero **al menos uno**; domicilio opcional (se guarda en la base).

## 3. Carga del reclamo

- Al final del wizard, antes de registrar: pantalla de **confirmación**
  *"¿Revisaste / chequeaste todo?"* con el resumen de lo cargado.
- Botón **REGISTRAR RECLAMO** → crea el **número de reclamo** (código, ya existe: ej. `A-2418`).

## 4. Estados y permisos del reclamante

| Mientras el estado sea… | El reclamante puede… |
|---|---|
| **RECIBIDO** (antes de que el Ente lo marque *Revisado* = `EN_REVISION`) | **Modificar** el reclamo · **Borrarlo** · **Agregar documental** (fotos/archivos) |
| **Cualquier estado** (incluso ya revisado) | **Ampliar declaratoria**: agregar información + cargar fotos, imágenes, videos |

- "Ampliar declaratoria" = agregar un aporte al reclamo en cualquier momento
  (texto + adjuntos), sin borrar nada de lo anterior.

## 5. Seguimiento e ida y vuelta (lo central)

- El reclamante **ve TODOS los comentarios** que le hace el ENCOSEP, **completos
  (no resumidos) y en orden cronológico**.
  - Ej.: *"Vecino, registramos su reclamo, vamos a hacer una constatación"* /
    *"Necesitamos que agregue documental (fotos, facturas, videos)"*.
- El reclamante **puede responder** y **el Ente puede volver a contestar**: hilo de
  **ida y vuelta**. Tanto el vecino como el Ente pueden **agregar algo** en cualquier momento.

## 6. Qué se OCULTA / ELIMINA en la vista del reclamante

- ❌ **No mostrar plazos propios del ENCOSEP** en ninguna pantalla (no atarnos a nada).
  → quitar el bloque "Plazo para resolver" (`slaDeadline`) de la vista del reclamo.
- ❌ **Eliminar el botón "Recurso directo"** (se quita de la UI; el campo en DB queda intacto).
- ℹ️ Texto informativo permitido (es plazo de la **prestadora**, no nuestro):
  *"Si usted reclamó a la prestadora, debe esperar los 15 días; igualmente ENCOSEP
  puede consultar el estado del mismo."*

## 7. Notificaciones
El medio cargado (celular/WhatsApp o email) se usa para avisar cambios de estado,
avance del expediente, pasos y resolución.

---

## 8. MAPA TÉCNICO (archivos a tocar) y qué afecta al schema

### A) Solo UI — NO tocan la base (100% seguro)
- `app/(ciudadano)/mis-reclamos/[codigo]/page.tsx`
  - quitar bloque "Plazo para resolver" (líneas del `slaDeadline`).
  - quitar bloque "¿Querés reclamar directo a la prestadora?" + "Recurso directo habilitado".
  - agregar el texto informativo de la prestadora (15 días).
- `app/(ciudadano)/reclamo/nuevo/wizard.tsx` → paso de confirmación "¿revisaste todo?".

### B) Cambios ADITIVOS de schema (no rompen; default seguro)
- `ReclamoEvento`: agregar `visibleVecino Boolean @default(false)` para distinguir
  **comentario público al vecino** vs nota interna. Los comentarios del Ente dirigidos
  al vecino se marcan `true` y se muestran en su vista (hoy se filtran todos los COMENTARIO).
- `AdjuntoTipo`: agregar `VIDEO` (o tratar video como `DOCUMENTO` para no migrar). A definir.

### C) Acciones nuevas del reclamante (server actions, sin tocar gestores)
- `ampliarDeclaratoria(codigo, texto, archivos[])` → crea `ReclamoEvento` (COMENTARIO,
  autor = ciudadano, visibleVecino=true) + `Adjunto[]`.
- `comentarVecino(codigo, texto)` → respuesta en el hilo.
- `editarReclamo` / `borrarReclamo` → **solo si estado = RECIBIDO**.
- `agregarAdjunto(codigo, archivos[])`.
- Reglas de permiso server-side por estado (no confiar solo en la UI).

---

## 9. PLAN POR FASES (para no romper nada)

- **Fase 1 — Solo UI (sin DB):** ocultar plazos, eliminar botón recurso directo,
  texto de la prestadora, confirmación "¿revisaste todo?". *Reversible y seguro.*
- **Fase 2 — Hilo ida y vuelta:** campo aditivo `visibleVecino`, mostrar comentarios
  del Ente al vecino, form para que el vecino responda.
- **Fase 3 — Ampliar declaratoria + adjuntos:** subir fotos/imágenes/videos en cualquier estado.
- **Fase 4 — Editar/Borrar en estado RECIBIDO** + registro simplificado (nombre+DNI) y datos de contacto.

Cada fase se prueba antes de pasar a la siguiente.

## 10. Decisiones abiertas
- [ ] "Cerrar un reclamo" = ¿finalizar la carga, o darlo por resuelto? (definir el verbo en la UI).
- [ ] Video: ¿tipo `VIDEO` nuevo o se sube como `DOCUMENTO`?
- [ ] ¿Aviso de cambio de contraseña en el primer ingreso? (recomendado).
