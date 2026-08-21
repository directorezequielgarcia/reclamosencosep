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
- Videos de reclamos: `reclamos/{reclamoId}/videos/{uuid}-{nombre}.ext`
  (o `reclamos/pendientes/{uuid}-{nombre}.ext` mientras el reclamo todavía no
  existe, ver sección siguiente)

---

## Videos de reclamos: subida directa navegador → Blob

Los videos NO pasan por `lib/uploads.ts` ni por ninguna Server Action/Route
Handler de la forma en que lo hacen fotos y documentos. Motivo: **Vercel
limita a ~4.5 MB el body que puede recibir cualquier función serverless**
(Server Action o Route Handler, en cualquier plan), y un video real de
celular fácilmente pesa 10-100 MB.

En cambio, el navegador sube el archivo **directo a Vercel Blob**, sin pasar
por nuestro servidor, usando el flujo de "client upload" del SDK:

1. El componente `components/ui/SubirVideoReclamo.tsx` llama a
   `upload()` de `@vercel/blob/client`, apuntando a
   `app/api/upload/reclamo-video/route.ts`.
2. Esa ruta implementa `handleUpload()`: valida que haya sesión, que el
   `pathname` pedido corresponda al reclamo (o a `reclamos/pendientes/` si
   el reclamo todavía no se creó — caso del wizard) y que quien pide el
   permiso sea el dueño del reclamo o un rol admin con permiso. Si todo
   está bien, devuelve un token firmado con `allowedContentTypes` (mp4,
   webm, mov, 3gp) y `maximumSizeInBytes` (50 MB) — Vercel Blob rechaza la
   subida si no cumple esas condiciones.
3. El navegador sube el archivo directo a Blob con ese token.
4. Recién ahí, con la URL ya resuelta, el componente dispara un form que
   llama a una Server Action normal (`agregarVideoReclamo` en
   `mis-reclamos/[codigo]/actions.ts`, `agregarVideoAdmin` en
   `admin/reclamo/[id]/actions.ts`, o el propio `POST /api/reclamos` para
   el wizard) que solo escribe el `Adjunto` (`tipo: "VIDEO"`) en la base —
   nunca mueve bytes.
5. Esas Server Actions validan la URL con
   `validarUrlBlobDeVideo()` (`lib/uploads.ts`): que sea un host
   `*.public.blob.vercel-storage.com` y que el pathname corresponda al
   reclamo, para que no se pueda colar una URL externa como si fuera un
   video propio.

Para **descargar** un video (no solo verlo embebido), Vercel Blob expone la
misma URL con `?download=1` — fuerza `Content-Disposition: attachment` sin
necesidad de una API route propia.

**Requisito**: esto solo funciona si `BLOB_READ_WRITE_TOKEN` está
configurado (ya lo está en Production/Preview). En desarrollo local sin ese
token, la subida de video no tiene a dónde ir — para probarla localmente hay
que traer las variables de Preview con `vercel env pull`.

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
| Videos de reclamos (subida directa a Blob) | 50 MB | MP4, WebM, MOV, 3GP |
| PDFs de cuadros tarifarios | 4 MB | Solo PDF |

El límite del body de Server Actions está configurado en 4 MB en `next.config.ts` (`serverActions.bodySizeLimit`). Este límite es independiente del límite de Vercel Hobby (4.5 MB en el plan gratuito).

---

## Implicancias de la migración

**Con PostgreSQL propio y sin Vercel Blob**: la tabla `ArchivoBlob` funciona exactamente igual. El único cambio es que la DB tiene más capacidad de almacenamiento según el servidor elegido.

**Con PostgreSQL propio y Vercel Blob**: igual que ahora. Los archivos van al CDN de Vercel, la DB solo guarda URLs.

**Recomendación para la migración**: si se mueve a un VPS o a un PostgreSQL en cloud con storage propio (Supabase Storage, por ejemplo), considerar también migrar los archivos existentes en `ArchivoBlob` para dejar la DB solo con metadatos. Los datos actuales en `ArchivoBlob` se pueden exportar con un script que lea cada registro y lo suba al nuevo storage.

**Límite práctico con bytea en PostgreSQL**: no hay límite técnico estricto para columnas `bytea`, pero almacenar PDFs directamente en la DB tiene impacto en el tamaño del backup y en la performance de los WAL logs. Para una carga moderada (decenas de PDFs mensuales de certificaciones) es perfectamente viable.
