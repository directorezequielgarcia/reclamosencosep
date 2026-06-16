# 03 — Base de datos

## Motor y ORM

- **Motor**: PostgreSQL (producción en Neon; migración objetivo: PostgreSQL propio).
- **ORM**: Prisma 6.x. El schema completo está en `prisma/schema.prisma`.
- **Conexión**: usa dos URLs — `DATABASE_URL` para el pooler de conexiones (PgBouncer en Neon) y `DATABASE_URL_UNPOOLED` para conexión directa (necesaria para migraciones DDL).

---

## Enums

### `Rol`
Define todos los roles posibles de un `Usuario`. Ver `docs/04_auth_roles.md` para la descripción funcional de cada uno.

```
CIUDADANO | GESTOR_ENTE | OPERADOR_PRESTADORA | SUPER_ADMIN | AUDITOR
DIRECTOR | COOPERATIVA_DOCS | EXPEDIENTES | INSPECCIONES | AUDIENCIAS_MEDIOS
PEM | CONCEJO_DELIBERANTE | AUTORIDAD_APLICACION
```

### `ServicioKind`
Los cuatro servicios bajo control del Ente:
```
RESIDUOS | ENERGIA | AGUA | TRANSPORTE
```

### `TipoDocumento`
Tipo de documento que una prestadora presenta al Ente:
```
ANUAL | MENSUAL | CERTIFICACION | CONTRATO | OTRO
```

### `EstadoDocumento`
Workflow de revisión de documentos:
```
PENDIENTE → EN_REVISION → ANALIZADO → APROBADO
                       ↘ OBSERVADO
                       ↘ INCOMPLETO
                       ↘ RECHAZADO
```

### `ReclamoEstado`
Estados del ciclo de vida de un reclamo:
```
RECIBIDO → EN_REVISION → DERIVADO → EN_PROCESO → RESUELTO
                       ↘ RECHAZADO            ↘ CERRADO_SIN_SOLUCION
```
Las transiciones permitidas están definidas en `lib/admin.ts` (`TRANSICIONES`).

### `TipoEvento`
Eventos del log de auditoría de un reclamo:
```
CREACION | CAMBIO_ESTADO | ASIGNACION | COMENTARIO | ADJUNTO | NOTIFICACION
```

### `ExpedienteEstado`
```
ABIERTO | EN_TRAMITE | RESUELTO | ARCHIVADO
```

### `TipoActo`
Tipos de actos administrativos dentro de un expediente:
```
CARATULACION | ACTA_RECEPCION | NOTIFICACION | INTIMACION | DESCARGO_PRESTADORA
CONSTATACION | AMPLIACION | DISPOSICION | CONVOCATORIA_AUDIENCIA | AUDIENCIA
DICTAMEN | DERIVACION | RESOLUCION | CIERRE | NOTA
```

### `AdjuntoTipo`
```
FOTO | VIDEO | AUDIO | DOCUMENTO
```

### `CanalMensaje`
```
USUARIO | PRESTADORA
```

### `NotaAmbito` / `NotaEstado`
Nota (comunicación formal entre organismos):
- Ámbito: `AUTORIDAD_APLICACION | CONCEJO_DELIBERANTE | PEM | PRESTADORA | OTRO`
- Estado: `BORRADOR | ENVIADA | RESPONDIDA | CERRADA`

### `TipoInspeccion`
```
OFICIO | DENUNCIA_VECINO | SEGUIMIENTO_EXPEDIENTE | EVENTO_PUNTUAL
```

### `EstadoInspeccion`
```
BORRADOR | PUBLICADA | ARCHIVADA
```

### `EstadoVencimiento`
```
PENDIENTE | CUMPLIDO | VENCIDO | PRORROGADO | EXCEPTUADO
```

### `EstadoInformeMensual` / `EstadoInformeAnual`
```
BORRADOR | PUBLICADO | ARCHIVADO
```

### `TipoBoletin`
```
BOLETIN_OFICIAL | COMUNICADO | NOTA_PRENSA | CLIPPING
```

### `ModalidadAudiencia` / `EstadoAudiencia`
- Modalidad: `PRESENCIAL | VIRTUAL | HIBRIDA`
- Estado: `PROGRAMADA | ABIERTA_INSCRIPCION | CERRADA_INSCRIPCION | REALIZADA | CANCELADA`

### `CuadroEstado`
```
VIGENTE | ANTERIOR | PEDIDO | BORRADOR
```

### `TipoCapacitacion` / `AudienciaCapacitacion`
- Tipo: `VIDEO | IMAGEN | GUIA`
- Audiencia: `TODOS | TEAM_ENCOSEP | AUTORIDAD_APLICACION | CONCEJO_DELIBERANTE | PEM | PRESTADORAS`

---

## Modelos

### `Usuario`
Tabla central de autenticación y autorización.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String (cuid) | PK |
| `dni` | String (unique) | Identificador de login; se normaliza quitando puntos y espacios |
| `nombre` / `apellido` | String | Nombre completo |
| `email` | String? (unique) | Opcional; usado para reset de password |
| `telefono` | String? | Opcional |
| `passwordHash` | String | Hash bcryptjs de la password |
| `passwordResetToken` | String? (unique) | Token de reset one-time |
| `passwordResetExpires` | DateTime? | Expiración del token de reset |
| `rol` | Rol | Rol del usuario (default `CIUDADANO`) |
| `prestadoraId` | String? | FK a `Prestadora`; solo para `OPERADOR_PRESTADORA` |
| `activo` | Boolean | Soft-enable: false bloquea el login |

**Relaciones**: tiene reclamos propios (`ReclamoCiudadano`), reclamos asignados (`ReclamoAsignado`), eventos, expedientes iniciados, actos, documentos subidos y revisados, boletines, audiencias, inspecciones, informes mensuales y anuales emitidos.

---

### `Servicio`
Catálogo fijo de los cuatro servicios controlados por el Ente.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String (cuid) | PK |
| `kind` | ServicioKind (unique) | Identificador semántico |
| `nombre` | String | Nombre completo |
| `nombreCorto` | String | Nombre abreviado para UI |

---

### `Prestadora`
Empresas concesionarias de los servicios.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String (cuid) | PK |
| `razonSocial` | String | Nombre legal |
| `cuit` | String? (unique) | CUIT argentino |
| `activa` | Boolean | `false` = prestadora inactiva (soft-delete funcional) |

**Relaciones**: `servicios` (M:N con `Servicio`), `operadores` (1:N con `Usuario`), `reclamos`, `expedientes`, `documentos`, `vencimientos`, `inspecciones`.

---

### `Documento`
Documentación formal que una prestadora presenta al Ente (balances, certificaciones, etc.).

| Campo | Tipo | Descripción |
|---|---|---|
| `tipo` | TipoDocumento | Categoría del documento |
| `periodo` | String | "2026" para anual, "2026-05" para mensual |
| `titulo` | String | Nombre descriptivo |
| `archivoUrl` | String | URL del archivo (Vercel Blob) o ruta a la API route (`/api/documentos/:id/archivo`) |
| `estado` | EstadoDocumento | Estado del workflow de revisión |
| `comentarioRevision` | String? | Observaciones del revisor |
| `subidoPorId` | String | FK al usuario que subió |
| `revisorId` | String? | FK al revisor del Ente |
| `revisadoEn` | DateTime? | Timestamp de la última revisión |
| `observaciones` | Json? | Análisis estructurado por sección (para certificaciones) |
| `conclusionGeneral` | String? | Resumen del análisis |
| `montoMaximo` | String? | Solo higiene urbana; monto máximo de certificación |
| `notaNumero` | String? | Número de la nota técnica generada (ej: "105/2026") |
| `notaDocxUrl` | String? | URL del .docx de la nota técnica |

**Índices**: `(prestadoraId, estado)`, `(tipo, periodo)`, `(estado)`.

---

### `ArchivoBlob`
Almacena el contenido binario de archivos en la DB cuando no hay Vercel Blob configurado. Tabla separada para no traer bytes en queries de lista.

| Campo | Tipo | Descripción |
|---|---|---|
| `documentoId` | String | FK a `Documento` |
| `tipo` | String | `"archivo"` o `"nota"` |
| `contenido` | Bytes | Contenido binario (bytea en PostgreSQL) |
| `mimeType` | String? | MIME del archivo |

**Unique**: `(documentoId, tipo)` — solo un blob de cada tipo por documento.
**Cascade**: se elimina si se elimina el `Documento`.

---

### `Reclamo`
Reclamo ciudadano o de oficio generado por el Ente.

| Campo | Tipo | Descripción |
|---|---|---|
| `codigo` | String (unique) | Código visible al ciudadano (ej: "A-2418") |
| `ciudadanoId` | String | FK al usuario que lo cargó (o al inspector si es de oficio) |
| `origenOficio` | Boolean | `true` si lo generó el Ente desde una inspección |
| `inspeccionOrigenId` | String? | FK a la `Inspeccion` que lo originó |
| `servicioId` | String | FK al `Servicio` |
| `prestadoraId` | String? | FK a la `Prestadora` involucrada |
| `asignadoAId` | String? | FK al gestor asignado del Ente |
| `titulo` / `descripcion` | String | Descripción del problema |
| `respuestas` | String? | JSON con respuestas del wizard de carga |
| `direccion` / `barrio` / `lat` / `lng` | — | Ubicación georreferenciada |
| `estado` | ReclamoEstado | Estado actual |
| `slaHoras` | Int | SLA en horas (default 72) |
| `slaDeadline` | DateTime? | Fecha límite del SLA |
| `expedienteId` | String? | FK al `Expediente` al que fue elevado |
| `recursoDirecto` | Boolean | Si el ciudadano interpuso recurso directo |
| `puntajeEnte` / `puntajePrestadora` | Int? | Calificación de la encuesta de cierre (1-5) |

**Índices**: `(estado, servicioId)`, `(ciudadanoId)`, `(prestadoraId, estado)`, `(expedienteId)`.

---

### `Expediente`
Expediente administrativo formal del Ente contra una prestadora.

| Campo | Tipo | Descripción |
|---|---|---|
| `numero` | String (unique) | Número formal (ej: "EXP-2026-001") |
| `caratula` | String | Carátula (ej: "ENCOSEP c/ SCPL s/ servicio de agua") |
| `asunto` | String | Descripción del asunto |
| `tipoExpediente` | String | Default "Reclamo individual" |
| `intervinientes` | String? | Texto libre: reclamante, prestadora, otros |
| `solicitadoPor` | String? | Origen del expediente |
| `prestadoraId` | String | FK a la `Prestadora` demandada |
| `estado` | ExpedienteEstado | Estado del expediente |
| `iniciadorId` | String | FK al usuario del Ente que abrió |

**Relaciones**: `reclamos`, `actos`, `inspecciones`, `mensajes` (chat interno con vecino/prestadora).

---

### `ActoAdministrativo`
Piezas formales dentro de un expediente (intimaciones, resoluciones, dictámenes, etc.).

| Campo | Tipo | Descripción |
|---|---|---|
| `expedienteId` | String | FK al `Expediente` |
| `tipo` | TipoActo | Tipo de acto |
| `titulo` | String | Título del acto |
| `cuerpo` | String | Texto completo (puede ser extenso) |
| `autorId` | String | FK al usuario autor |
| `notificadoEn` | DateTime? | Cuándo se notificó formalmente |
| `notificadoA` | String? | A quién se notificó |
| `visiblePrestadora` | Boolean | Si la prestadora puede verlo |
| `confirmadoEn` | DateTime? | `null` = borrador; con fecha = confirmado |

---

### `MensajeExpediente`
Chat interno dentro de un expediente, separado en dos canales: con el vecino y con la prestadora.

| Campo | Tipo | Descripción |
|---|---|---|
| `expedienteId` | String | FK al `Expediente` |
| `canal` | CanalMensaje | `USUARIO` o `PRESTADORA` |
| `autorId` | String | ID del autor |
| `autorNombre` | String | Nombre desnormalizado (para mostrar sin join) |
| `esEnte` | Boolean | `true` si lo escribió el equipo ENCOSEP |
| `cuerpo` | String | Texto del mensaje |

---

### `Inspeccion`
Inspecciones de campo realizadas por el equipo del Ente.

| Campo | Tipo | Descripción |
|---|---|---|
| `codigo` | String (unique) | Código (ej: "INS-2026-001") |
| `fecha` | DateTime | Fecha y hora del relevamiento |
| `inspectorId` | String | FK al inspector |
| `servicioId` | String | FK al `Servicio` |
| `prestadoraId` | String? | FK a la `Prestadora` relevada |
| `tipo` | TipoInspeccion | Tipo de inspección |
| `estado` | EstadoInspeccion | `BORRADOR`, `PUBLICADA`, `ARCHIVADA` |
| `titulo` | String | Resumen en una línea |
| `observaciones` | String | Texto largo de lo relevado |
| `direccion` / `barrio` / `lat` / `lng` | — | Geolocalización |
| `audioUrl` / `audioMimeType` / `audioBytes` / `audioDuracionSeg` | — | Audio dictado en campo |
| `transcripcionAudio` | String? | Transcripción editable del audio |
| `actaUrl` | String? | URL del .docx del acta generada |

**Relaciones**: `fotos` (1:N con `InspeccionFoto`), `reclamos` vinculados, `reclamosOriginados` (reclamos de oficio generados a partir de ella), `expediente` vinculado.

---

### `InformeMensual`
Un registro por mes/año con las 7 secciones obligatorias del art. 5° inc. k de la Ordenanza 13.189/17.

| Campo | Tipo | Descripción |
|---|---|---|
| `mes` | Int | 1-12 |
| `anio` | Int | Año |
| `estado` | EstadoInformeMensual | Borrador → Publicado → Archivado |
| `bloques` | Json | Las 7 secciones narrativas estructuradas |
| `metricas` | Json | Cifras congeladas al momento de emitir |
| `docxUrl` | String? | URL del .docx generado |

**Unique**: `(anio, mes)` — no puede haber dos informes del mismo mes/año.

---

### `InformeAnual`
Informe anual de gestión (deadline 1° de octubre, al Concejo Deliberante y al PEM).

| Campo | Tipo | Descripción |
|---|---|---|
| `periodoDesde` / `periodoHasta` | DateTime | Período que cubre |
| `titulo` | String | Ej: "Informe de Gestión 2025-2026" |
| `bloques` | Json | Secciones narrativas (balance, logros, desafíos, sugerencias, anexo) |
| `metricas` | Json | Cifras congeladas al emitir |
| `docxUrl` | String? | URL del .docx generado |

---

### `CuadroTarifario`
Cuadros de tarifas de los servicios; alimentan la calculadora pública.

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | String | Nombre descriptivo |
| `expediente` | String? | Número de expediente de aprobación |
| `estado` | CuadroEstado | `VIGENTE`, `ANTERIOR`, `PEDIDO`, `BORRADOR` |
| `datos` | Json | Estructura completa de tarifas (ver `lib/tarifas.ts`) |
| `publicado` | Boolean | Si es visible en la calculadora pública |

---

### Otros modelos

| Modelo | Función |
|---|---|
| `ReclamoEvento` | Log de auditoría de cambios en un reclamo |
| `Adjunto` | Archivos adjuntos a un reclamo (fotos, audio, PDF) |
| `Nota` / `NotaMensaje` / `NotaAdjunto` | Comunicaciones formales del Ente con organismos externos |
| `Boletin` | Boletines oficiales, comunicados y clipping de medios |
| `AudienciaPublica` / `InscripcionAudiencia` | Gestión de audiencias públicas con inscripciones online |
| `Vencimiento` | Control de vencimientos de documentación de prestadoras |
| `EncuestaServicios` | Encuesta de satisfacción general (anónima) |
| `InspeccionFoto` | Fotos vinculadas a una inspección de campo |
| `ActoAdjunto` | Archivos adjuntos a un acto administrativo |
| `Capacitacion` | Material de capacitación por módulo y audiencia |

---

## Diagrama de relaciones (texto)

```
Usuario ──< Reclamo (ciudadanoId)
         └─< Reclamo (asignadoAId)
         └─< Inspeccion (inspectorId)
         └─< Documento (subidoPorId / revisorId)
         └─< Expediente (iniciadorId)
         └─< ActoAdministrativo (autorId)

Prestadora ──< Usuario (operadores)
            └─< Reclamo
            └─< Expediente
            └─< Documento
            └─< Inspeccion
            └─< Vencimiento
            >─< Servicio (M:N)

Reclamo ──< ReclamoEvento
         └─< Adjunto
         └─> Expediente (expedienteId, opcional)
         └─> Inspeccion (inspeccionOrigenId, si es de oficio)

Expediente ──< ActoAdministrativo
             └─< MensajeExpediente
             └─< Inspeccion
             └─< Reclamo

Documento ──< ArchivoBlob (onDelete: Cascade)

Inspeccion ──< InspeccionFoto
             └─< Reclamo (reclamosOriginados)

AudienciaPublica ──< InscripcionAudiencia (onDelete: Cascade)

Nota ──< NotaMensaje ──< NotaAdjunto
```

---

## Guía de migración a PostgreSQL propio

No se requiere ningún cambio de código: Prisma abstrae el motor de base de datos. El proceso completo está en `docs/08_deploy_migracion.md`.

Resumen técnico:

1. Cambiar `DATABASE_URL` y `DATABASE_URL_UNPOOLED` para que apunten al nuevo PostgreSQL.
2. Ejecutar `npx prisma migrate deploy` — aplica todas las migraciones existentes en orden.
3. Opcionalmente ejecutar `npx prisma db seed` para cargar datos iniciales.
4. No hay que tocar el código fuente.

---

## Consideraciones técnicas

- **Índices**: ya están definidos en el schema sobre las columnas más consultadas. No hace falta crearlos manualmente.
- **Soft-delete**: no está implementado de forma genérica. `Prestadora` tiene el campo `activa: Boolean` como control operativo. Los registros de `Usuario` tienen `activo: Boolean`. El resto de los modelos no tiene soft-delete; borrar registros es definitivo.
- **Cascades**: `ArchivoBlob`, `MensajeExpediente`, `ActoAdministrativo`, `ReclamoEvento`, `Adjunto`, `InscripcionAudiencia`, `NotaMensaje` y `NotaAdjunto` se eliminan en cascada si se elimina su padre.
- **Columnas Json**: `Documento.observaciones`, `InformeMensual.bloques/metricas`, `InformeAnual.bloques/metricas` y `CuadroTarifario.datos` usan el tipo `Json` de Prisma (mapeado a `jsonb` en PostgreSQL). No requieren migración especial.
- **Bytes (bytea)**: `ArchivoBlob.contenido` se mapea a `bytea` en PostgreSQL. En Neon y en cualquier PostgreSQL estándar funciona igual.
