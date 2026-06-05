# Mejoras y pendientes — análisis por sección

> Relevamiento hecho al cierre de la jornada. Prioridad: 🔴 alta · 🟠 media · 🟢 baja.
> Nada de esto está roto; son mejoras para subir la calidad.

## Transversal (todo el sistema)
- 🔴 **Anti-duplicados en TODOS los formularios.** El botón que se bloquea al
  enviar (useFormStatus) está en Expedientes; falta replicarlo en Notas,
  Capacitación, Reclamos y alta de usuarios.
- 🔴 **Notificaciones al vecino** (email / WhatsApp) cuando hay novedad en su
  reclamo o expediente. Hoy el vecino tiene que entrar a mirar.
- 🟠 **Búsqueda y filtros** en las bandejas (reclamos, expedientes, notas):
  por estado, servicio, barrio, fecha, texto.
- 🟠 **Paginación** en listas largas (hoy traen todo).
- 🟠 **Auditoría**: registrar quién hizo cada acción sensible (cambios de estado,
  borrados, notificaciones).
- 🟢 **Validación de tamaño/tipo de archivo** con mensajes claros al usuario.

## Reclamos
- 🔴 **Documental del vecino**: hoy solo sube **fotos**. Permitir **video, audio
  y PDF** (los actos del expediente ya lo aceptan; falta en el reclamo).
- 🟠 **Filtros en la bandeja** (estado, servicio, barrio, vencimiento).
- 🟠 **Aviso al vecino** cuando el Ente responde en el chat.

## Expedientes
- 🔴 **Plazos / vencimientos por etapa**: alertas cuando una parte se demora
  (el panel de "Estado del trámite" ya muestra el tiempo; falta el aviso activo).
- 🟠 **Importar informe mensual** (única fuente del centro de importación que
  falta; ya están reclamo, expediente, estadística, inspección, documental).
- 🟠 **Permisos finos por etapa**: que la prestadora y la Secretaría puedan
  trabajar SU etapa (hoy el Ente labra casi todo; la prestadora solo descargo).
- 🟠 **Búsqueda de expedientes** por número, carátula, prestadora.
- 🟢 **Índice de fojas** en el documento emitido.
- 🟢 **Foliado por hoja física** (hoy foja = acto; sirve, pero no es por página).

## Notas
- 🔴 **Anti-duplicado** en responder/crear nota.
- 🟠 **Aviso a la contraparte** cuando recibe una nota nueva.
- 🟠 **Exportar el hilo completo** (hoy la nota formal exporta el primer mensaje;
  sumar las respuestas y los adjuntos al PDF).
- 🟢 **Filtros** en la bandeja (ámbito, estado).

## Capacitación
- 🟠 **Guía virtual de las etapas del expediente**: cargar el contenido (lo puede
  redactar Claude) como guía paso a paso.
- 🟠 **Marcar "visto" / progreso** por usuario.
- 🟢 **Subir videos propios** (hoy solo enlaces de YouTube/Drive — está bien por
  la regla de costo cero, pero se puede sumar).
- 🟢 **Reordenar** items con arrastrar.

## Tablero institucional (Concejo / PEM / Autoridad de Aplicación)
- 🔴 **Autoridad de Aplicación**: que vea **los expedientes reales** y las
  **recomendaciones de sanción** (hoy figuran como "Próximamente").
- 🟠 **Indicadores reales** embebidos en el tablero (no solo enlaces).
- 🟠 **Agenda / asistencia técnica** del Concejo (hoy "Próximamente").

## Inspecciones
- 🟢 Ya quedó vinculable a expediente e importable como constatación. Sumar
  **filtros** y **export del acta**.

## Seguridad y cuentas
- 🔴 **Cambio de clave obligatorio** en el primer ingreso (los usuarios entran
  con el DNI como clave).
- 🟠 Revisión de **permisos por rol** ahora que hay muchos roles nuevos.

---

## Top 5 sugerido para la próxima sesión
1. 🔴 Anti-duplicados en todos los formularios (rápido, alto impacto).
2. 🔴 Notificaciones al vecino (email gratis con Resend / similar).
3. 🔴 Documental del vecino con video/PDF.
4. 🔴 Autoridad de Aplicación viendo expedientes reales.
5. 🟠 Búsqueda y filtros en las bandejas.
