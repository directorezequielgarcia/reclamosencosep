# 05 — Almacenamiento de archivos

## Estrategia dual

El sistema tiene dos modos de almacenamiento, que se seleccionan automáticamente según la presencia de la variable de entorno `BLOB_READ_WRITE_TOKEN`:

| Condición | Modo | Dónde se guarda |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` no definida | DB fallback | Tabla `ArchivoBlob` (bytea en PostgreSQL) |
| `BLOB_READ_WRITE_TOKEN` definida | Vercel Blob | CDN de Vercel (storage externo) |

Esta lógica está centralizada en `lib/uploads.ts`. En dev local, si no se configura el token, los archivos se guardan en `public/uploads/` (filesystem local). En Vercel serverless, el filesystem no persiste entre invocaciones, por lo que en producción sin Vercel Blob los archivos van a la tabla `ArchivoBlob`.

---

## Modo DB fallback (`ArchivoBlob`)

### Para qué sirve

Cuando no hay Vercel Blob configurado, el contenido binario de los archivos subidos por las prestadoras (PDFs de certificaciones, balances) y las notas técnicas generadas (.docx) se almacena en la tabla `ArchivoBlob`.

### Estructura de la tabla

```
ArchivoBlob {
  id          cuid
  documentoId FK → Documento (cascade delete)
  tipo        "archivo" | "nota"
  contenido   bytea (el binario completo)
  mimeType    String?
  createdAt   DateTime
  UNIQUE(documentoId, tipo)
}
```

Hay un máximo de dos blobs por documento: el archivo original (`tipo = "archivo"`) y la nota técnica generada (`tipo = "nota"`).

### Cómo se accede

Los archivos en `ArchivoBlob` no tienen URL pública directa. Se sirven a través de API routes que los recuperan de la DB y los entregan con los headers de MIME correctos:

- `GET /api/documentos/[id]/archivo` — sirve el PDF del documento.
- `GET /api/documentos/[id]/nota` — sirve el .docx de la nota técnica.

Ambas rutas verifican la sesión y el rol antes de responder (401 sin sesión, 403 sin permiso, verificación adicional de que el `OPERADOR_PRESTADORA` solo accede a documentos de su propia prestadora).

---

## Modo Vercel Blob

Cuando `BLOB_READ_WRITE_TOKEN` está definida, los archivos se suben a Vercel Blob usando `@vercel/blob` (función `put()`). La URL pública del blob se guarda en el campo `archivoUrl` del `Documento` y la URL del .docx en `notaDocxUrl`.

Los paths en el blob siguen esta convención:
- Documentos de prestadoras: `documentos/{prestadoraId}/{documentoId}.pdf`
- PDFs de cuadros tarifarios: `cuadros/{cuadroId}.pdf`
- Fotos de reclamos: `reclamos/{reclamoId}/{uuid}.jpg`
- Fotos de inspecciones: `inspecciones/{inspeccionId}/fotos/{uuid}.jpg`
- Audio de inspecciones: `inspecciones/{inspeccionId}/audio/dictado-{timestamp}.webm`
- Adjuntos de actos: `actos/{actoId}/{uuid}.ext`

---

## Límites de archivos

Definidos en `lib/uploads.ts`:

| Tipo | Límite | Formatos permitidos |
|---|---|---|
| Documentos de prestadoras | 4 MB | PDF, DOC, DOCX, XLS, XLSX, JPEG, PNG |
| Fotos de reclamos e inspecciones | 8 MB | JPEG, PNG, WebP, HEIC |
| PDFs adjuntos a reclamos | 4 MB | PDF |
| Audio de inspecciones | 20 MB | WebM, OGG, MP3, MP4, M4A, WAV |
| Videos adjuntos a actos | 50 MB | MP4, WebM, MOV, 3GP |
| PDFs de cuadros tarifarios | 4 MB | Solo PDF |

El límite del body de Server Actions está configurado en 4 MB en `next.config.ts` (`serverActions.bodySizeLimit`). Este límite es independiente del límite de Vercel Hobby (4.5 MB en el plan gratuito).

---

## Implicancias de la migración

**Con PostgreSQL propio y sin Vercel Blob**: la tabla `ArchivoBlob` funciona exactamente igual. El único cambio es que la DB tiene más capacidad de almacenamiento según el servidor elegido.

**Con PostgreSQL propio y Vercel Blob**: igual que ahora. Los archivos van al CDN de Vercel, la DB solo guarda URLs.

**Recomendación para la migración**: si se mueve a un VPS o a un PostgreSQL en cloud con storage propio (Supabase Storage, por ejemplo), considerar también migrar los archivos existentes en `ArchivoBlob` para dejar la DB solo con metadatos. Los datos actuales en `ArchivoBlob` se pueden exportar con un script que lea cada registro y lo suba al nuevo storage.

**Límite práctico con bytea en PostgreSQL**: no hay límite técnico estricto para columnas `bytea`, pero almacenar PDFs directamente en la DB tiene impacto en el tamaño del backup y en la performance de los WAL logs. Para una carga moderada (decenas de PDFs mensuales de certificaciones) es perfectamente viable.
