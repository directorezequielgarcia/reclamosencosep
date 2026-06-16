# Informe Técnico — Portal ENCOSEP
## Para el desarrollador que toma el proyecto

---

## 1. Qué es el sistema

**Portal de Control de Servicios Públicos — ENCOSEP**
Municipalidad de Comodoro Rivadavia. Ordenanza 13.189/17.

El sistema tiene **dos partes**:

| Parte | URL | Quién la usa |
|---|---|---|
| Portal ciudadano | `/` `/reclamos` `/mis-reclamos` | Vecinos, ciudadanos |
| Panel administrativo | `/admin/*` | Equipo ENCOSEP, prestadoras, instituciones |

**Funcionalidades construidas:**
- Reclamos ciudadanos (alta, seguimiento, gestión)
- Documentación de prestadoras (subida de PDFs, revisión, análisis, generación de notas Word)
- Módulo de análisis de certificaciones mensuales (observaciones por sección + nota .docx automática)
- Expedientes administrativos
- Inspecciones de campo (con GPS, fotos, audio)
- Audiencias públicas
- Notas institucionales
- Calculadora de tarifas
- Informes mensuales y anuales
- Panel de gestión de usuarios

---

## 2. Stack tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| **Next.js** | 16.2.6 | Framework full-stack (App Router) |
| **React** | 19.2.4 | UI |
| **TypeScript** | 5.x | Lenguaje |
| **Prisma** | 6.19.3 | ORM — abstrae PostgreSQL completamente |
| **PostgreSQL** | (Neon cloud) | Base de datos |
| **NextAuth.js** | 5.0.0-beta.31 | Autenticación (JWT, sin adapter de DB) |
| **bcryptjs** | 3.0.3 | Hash de passwords |
| **Zod** | 4.4.3 | Validación de datos en Server Actions |
| **docx** | 9.7.0 | Generación de archivos Word (.docx) |
| **@vercel/blob** | 2.4.0 | Storage de archivos (alternativa al fallback en DB) |
| **Tailwind CSS** | 4.x | Estilos |
| **Vercel** | — | Hosting (actualmente plan Hobby) |

**Repositorio:** `https://github.com/directorezequielgarcia/reclamosencosep`
**URL producción:** `https://reclamosencosep.vercel.app`

---

## 3. Arquitectura Next.js App Router

### Patrones usados

```
app/
├── (public)/           → Rutas sin auth (landing, reclamos ciudadano)
├── admin/              → Panel admin (todas requieren sesión)
│   ├── documentacion/  → Módulo documentación prestadoras
│   ├── inspecciones/   → Inspecciones de campo
│   ├── expedientes/    → Expedientes administrativos
│   └── ...
├── api/                → API Routes (solo para servir archivos binarios)
│   ├── documentos/[id]/archivo/   → Sirve PDF subido por prestadora
│   └── documentos/[id]/nota/      → Sirve .docx generado por ENCOSEP
lib/
├── auth.ts             → Configuración NextAuth
├── prisma.ts           → Singleton Prisma Client
├── admin.ts            → Helpers de permisos por rol
├── uploads.ts          → Lógica de almacenamiento de archivos
├── documentos.ts       → Metadatos de tipos/estados de documentos
├── docx-certificacion.ts → Generador de Nota Word ENCOSEP
└── docx-acta-inspeccion.ts → Generador de Acta de Inspección Word
prisma/
├── schema.prisma       → Esquema completo de la DB
├── migrations/         → Historial de migraciones
└── seed.ts             → Datos iniciales (servicios, prestadoras demo, usuarios demo)
```

### Regla Server vs Client

- **Server Components** (default): consultan DB directamente, sin JS en el browser
- **Client Components** (`"use client"`): formularios reactivos, estado local
- **Server Actions** (`"use server"`): mutaciones — validación Zod + lógica de negocio
- **API Routes**: solo para respuestas binarias (archivos, PDFs, docx) que los Server Actions no pueden devolver

---

## 4. Base de datos — Esquema completo

### Enums

```
Rol: CIUDADANO | GESTOR_ENTE | OPERADOR_PRESTADORA | SUPER_ADMIN | AUDITOR |
     DIRECTOR | COOPERATIVA_DOCS | EXPEDIENTES | INSPECCIONES |
     AUDIENCIAS_MEDIOS | PEM | CONCEJO_DELIBERANTE | AUTORIDAD_APLICACION

ServicioKind: RESIDUOS | ENERGIA | AGUA | TRANSPORTE

TipoDocumento: ANUAL | MENSUAL | CERTIFICACION | CONTRATO | OTRO

EstadoDocumento: PENDIENTE | EN_REVISION | ANALIZADO | APROBADO |
                 OBSERVADO | INCOMPLETO | RECHAZADO

ReclamoEstado: RECIBIDO | EN_REVISION | DERIVADO | EN_PROCESO |
               RESUELTO | CERRADO_SIN_SOLUCION | RECHAZADO

EstadoExpediente: INICIADO | EN_TRAMITE | EN_AUDIENCIA | RESUELTO |
                  ARCHIVADO | ANULADO

TipoActo: PROVIDENCIA | RESOLUCION | DISPOSICION | NOTA | INFORME | OTRO

NivelInfraccion: LEVE | GRAVE | MUY_GRAVE

EstadoInspeccion: PROGRAMADA | EN_CAMPO | COMPLETADA | CANCELADA

TipoAudiencia: ORDINARIA | EXTRAORDINARIA | TARIFA | CONCESION | OTRO

EstadoAudiencia: CONVOCADA | CELEBRADA | SUSPENDIDA | CANCELADA
```

### Modelos principales y sus relaciones

```
Usuario           → tiene un Rol, puede tener Prestadora (si es OPERADOR_PRESTADORA)
Prestadora        → tiene muchos Servicio (RESIDUOS, ENERGIA, AGUA, TRANSPORTE)
                  → tiene muchos Documento, Reclamo, Expediente, Inspeccion

Documento         → pertenece a Prestadora y a Usuario (subidoPor)
                  → tiene muchos ArchivoBlob (contenido binario)
                  → campos análisis: observaciones (JSON), conclusionGeneral, montoMaximo,
                    notaNumero, notaDocxUrl, notaEmitidaEn

ArchivoBlob       → almacena contenido binario (bytea) cuando no hay Blob externo
                  → tipo: "archivo" (PDF subido) | "nota" (docx generado)
                  → @unique([documentoId, tipo]) — un archivo por tipo por documento

Reclamo           → pertenece a Prestadora, tiene muchos ReclamoEvento y AdjuntoReclamo
Expediente        → tiene muchos ActoAdministrativo, Inspeccion (via expedienteId)
Inspeccion        → tiene GPS (InspeccionGPS), fotos, audio, puede generar Acta Word
AudienciaPublica  → tiene Participantes, Resoluciones
InformeMensual    → informe mensual art. 5 inc. k Ord. 13.189/17
InformeAnual      → informe anual de gestión
Boletin           → clipping de medios / comunicados
Vencimiento       → vencimientos de documentación regulatoria
CuadroTarifario   → cuadros tarifarios para la calculadora
Capacitacion      → cursos/talleres para el portal de capacitación
```

---

## 5. Autenticación y Roles

### Flujo de autenticación

1. Usuario ingresa DNI + password en `/ingresar`
2. NextAuth valida contra `Usuario.passwordHash` (bcrypt)
3. Emite JWT firmado con `AUTH_SECRET` — se almacena en cookie HttpOnly
4. Cada request al panel admin valida el JWT
5. El rol del usuario viene en el JWT (`session.user.rol`)

**Importante:** NextAuth está en modo JWT puro (stateless). No hay tabla de sesiones en la DB. El rol se embebe en el token al login — si un admin cambia el rol de un usuario, el efecto no aplica hasta que el usuario vuelva a loguearse.

### Roles y permisos

| Rol | Descripción |
|---|---|
| `SUPER_ADMIN` | Acceso total. Perfil técnico del sistema. |
| `DIRECTOR` | Directorio del Ente (Serdeiro, García, López). Ve y opera todo, emite informes oficiales. |
| `GESTOR_ENTE` | Rol legacy general del equipo ENCOSEP. |
| `COOPERATIVA_DOCS` | Adriana — gestión documentación de prestadoras. |
| `EXPEDIENTES` | Yanina — expedientes administrativos. |
| `INSPECCIONES` | Julieta — inspecciones de campo. |
| `AUDIENCIAS_MEDIOS` | Marcos — audiencias y comunicación. |
| `OPERADOR_PRESTADORA` | Personal de la empresa concesionaria. Solo ve sus propios datos. |
| `AUDITOR` | Solo lectura. |
| `CIUDADANO` | Portal público — solo reclamos propios. |
| `PEM` | Poder Ejecutivo Municipal (Secretaría de Gobierno). |
| `CONCEJO_DELIBERANTE` | Concejo Deliberante. |
| `AUTORIDAD_APLICACION` | Aplica sanciones. |

### Helpers en `lib/admin.ts`

```typescript
esDireccion(rol)              // DIRECTOR | SUPER_ADMIN
puedeRevisarDocumentos(rol)   // + COOPERATIVA_DOCS | GESTOR_ENTE
puedeVerDocumentos(rol)       // + OPERADOR_PRESTADORA | AUDITOR
puedeGestionarExpedientes(rol)
puedeGestionarInspecciones(rol)
puedeGestionarReclamos(rol)
// ... ver lib/admin.ts para el listado completo
```

---

## 6. Almacenamiento de archivos

### Estrategia actual (dual)

```
¿Está definida BLOB_READ_WRITE_TOKEN?
├── SÍ → Vercel Blob (CDN externo, sin límite práctico de tamaño)
└── NO → ArchivoBlob en PostgreSQL (bytea, limitado a 4MB por request)
```

### Tabla ArchivoBlob

Creada específicamente para evitar cargar bytes en queries normales de `Documento`:

```sql
CREATE TABLE "ArchivoBlob" (
  id           TEXT PRIMARY KEY,
  "documentoId" TEXT NOT NULL,
  tipo         TEXT NOT NULL,  -- 'archivo' | 'nota'
  contenido    BYTEA NOT NULL,
  "mimeType"   TEXT,
  "createdAt"  TIMESTAMP DEFAULT now(),
  UNIQUE ("documentoId", tipo),
  FOREIGN KEY ("documentoId") REFERENCES "Documento"(id) ON DELETE CASCADE
);
```

### Archivos que maneja el sistema

| Tipo | Ruta API | Tamaño típico |
|---|---|---|
| PDF certificación (prestadora) | `/api/documentos/[id]/archivo` | 500KB–5MB |
| Nota .docx ENCOSEP generada | `/api/documentos/[id]/nota` | ~100KB |
| Fotos de reclamos | `/api/reclamos` (Blob directo) | hasta 8MB |
| Fotos de inspecciones | filesystem local / Blob | hasta 8MB |
| Audio de inspecciones | filesystem local / Blob | hasta 20MB |
| Adjuntos de actos admin | filesystem local / Blob | hasta 50MB |

### Limitación crítica actual

Sin Vercel Blob configurado, **todo lo que supere 4MB falla** porque:
- Next.js Server Actions tienen `bodySizeLimit: "4mb"` (configurado en `next.config.ts`)
- Vercel Hobby Plan limita los payloads de funciones serverless a ~4.5MB
- El filesystem de Vercel es **read-only** (no se puede escribir a disco)

---

## 7. Limitaciones del entorno actual (Vercel Hobby)

| Limitación | Valor actual | Impacto |
|---|---|---|
| Timeout de función serverless | 10 segundos | Queries lentas o generación de docx compleja pueden fallar |
| Tamaño máximo de payload | 4.5 MB | Archivos grandes no se pueden subir sin Blob |
| Filesystem | Read-only | Sin Blob, archivos van a DB (lento para archivos grandes) |
| Ejecuciones concurrentes | Limitadas | En picos de uso puede haber colas |
| DB (Neon free tier) | 512 MB storage, 0.25 vCPU | Lento bajo carga sostenida |
| Bandwidth | 100 GB/mes | Suficiente para el MVP |

---

## 8. Seguridad — Estado actual

### Implementado

- Passwords hasheados con bcrypt (cost factor 10)
- JWT firmado con `AUTH_SECRET` (cookie HttpOnly, no accesible desde JS)
- Validación de inputs con Zod en todos los Server Actions
- Filtros por `prestadoraId` — OPERADOR_PRESTADORA no puede ver datos de otras empresas
- CSRF protegido por NextAuth + SameSite cookies
- Rutas admin protegidas con middleware de sesión

### Pendiente / Recomendaciones

1. **Rate limiting en login**: actualmente no hay límite de intentos. Un atacante puede hacer fuerza bruta al endpoint `/api/auth/callback/credentials`. Implementar con `upstash/ratelimit` o middleware propio.

2. **Headers de seguridad HTTP**: agregar en `next.config.ts`:
   ```typescript
   headers: async () => [{
     source: '/(.*)',
     headers: [
       { key: 'X-Frame-Options', value: 'DENY' },
       { key: 'X-Content-Type-Options', value: 'nosniff' },
       { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
       { key: 'Content-Security-Policy', value: "default-src 'self'..." },
     ]
   }]
   ```

3. **AUTH_SECRET en producción**: debe ser un string aleatorio de al menos 32 caracteres. El valor actual en `.env` es un placeholder. Verificar que en Vercel esté seteado con un valor fuerte.

4. **Auditoría de acciones**: no hay log de acciones críticas (quién aprobó qué, quién cambió estado de un expediente). Para un ente regulador, esto es importante.

5. **Soft delete**: actualmente `Prestadora` tiene `activa: Boolean` pero `Usuario` no. Agregar `activo` + `deletedAt` a Usuario para desactivar sin perder historial.

6. **Rotación de tokens de reset de password**: el campo `passwordResetExpires` existe pero verificar que esté implementado en el flujo de reset.

---

## 9. Variables de entorno requeridas

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | PostgreSQL con connection pooling | `postgresql://user:pass@host/db?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | PostgreSQL directo (para migraciones) | `postgresql://user:pass@host/db?sslmode=require` |
| `AUTH_SECRET` | Clave para firmar JWT — mínimo 32 chars aleatorios | `openssl rand -base64 32` |
| `AUTH_URL` | URL base del sitio | `https://reclamosencosep.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob (opcional) | `vercel_blob_rw_...` |

---

## 10. Migración a PostgreSQL propio

El código **no necesita cambios**. Prisma abstrae completamente el motor. Solo cambian las variables de entorno.

### Opciones de hosting PostgreSQL

| Opción | Free tier | Límites free | Recomendado para |
|---|---|---|---|
| **Supabase** | Sí | 500MB, 2 proyectos | Desarrollo y MVP |
| **Railway** | Sí (limitado) | $5/mes luego | Producción pequeña |
| **Render** | Sí | 1GB, se duerme | Desarrollo |
| **VPS propio** (Hetzner, DigitalOcean) | No | Sin límites | Producción robusta |
| **Neon** (actual) | Sí | 512MB | OK para MVP |

### Pasos para migrar

```bash
# 1. Provisionar nueva DB PostgreSQL y obtener las dos URLs:
#    - DATABASE_URL (con pooler, si el proveedor lo ofrece)
#    - DATABASE_URL_UNPOOLED (conexión directa)

# 2. Actualizar variables de entorno en Vercel (o .env.local)

# 3. Aplicar el schema a la nueva DB (no usar migrate dev, usar deploy)
npx prisma migrate deploy

# 4. (Opcional) Exportar datos de Neon antes de migrar
pg_dump "postgresql://user:pass@neon-host/db" > backup.sql
psql "postgresql://user:pass@nueva-db/db" < backup.sql

# 5. Redeploy en Vercel para que tome las nuevas variables
# Dashboard Vercel → Settings → Environment Variables → actualizar → Redeploy
```

### Con VPS propio (máxima robustez)

```bash
# Docker Compose recomendado:
# postgres:16-alpine + volumen persistente + backup automático
# Elimina todos los límites de free tier
# Permite archivos grandes sin restricciones
# Costo ~5-10 USD/mes (Hetzner CX21 o similar)
```

---

## 11. Para eliminar las limitaciones de archivos (definitivo)

### Opción A: Vercel Blob (más simple)
1. Dashboard Vercel → Storage → Create → Blob → conectar al proyecto
2. Agrega `BLOB_READ_WRITE_TOKEN` automáticamente
3. Redeploy → archivos van al CDN de Vercel (sin límite práctico)
4. Sin cambios de código — el sistema ya está preparado

### Opción B: Cloudflare R2 (más económico a escala)
- Compatible con S3 API
- Requiere cambiar `lib/uploads.ts` para usar `@aws-sdk/client-s3`
- 10 GB free tier, luego $0.015/GB

### Opción C: MinIO en VPS propio
- S3-compatible, self-hosted
- Control total, sin límites externos
- Requiere VPS con Docker

### Opción D: Subida directa desde el browser (client-side upload)
- El archivo va directamente al storage (Blob/R2/MinIO) sin pasar por el servidor
- Elimina el límite de 4.5MB del payload serverless
- Requiere refactorizar el formulario de subida con `@vercel/blob/client` (putBlobData)
- Más complejo pero es la solución correcta para producción con archivos grandes

---

## 12. Estado del proyecto al momento de este informe

**Fecha:** junio 2026
**Commit actual:** `38af9b0`

### Módulos completados
- Portal de reclamos ciudadano ✅
- Panel admin base ✅
- Gestión de documentación de prestadoras ✅
- Análisis de certificaciones + generación de Nota ENCOSEP Word ✅
- Expedientes administrativos ✅
- Inspecciones de campo ✅
- Audiencias públicas ✅
- Notas institucionales ✅
- Calculadora de tarifas ✅
- Informes mensuales/anuales ✅
- Gestión de usuarios ✅

### Deuda técnica conocida
- Sin rate limiting en login
- Sin headers de seguridad HTTP
- Archivos > 4MB fallan sin Vercel Blob configurado
- Sin auditoría de acciones críticas
- Sin soft-delete en Usuario
- AUTH_SECRET en producción debe verificarse (no usar el valor placeholder del .env.example)
