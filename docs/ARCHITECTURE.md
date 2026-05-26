# Arquitectura — Portal ENCOSEP

## Resumen ejecutivo

App **monolito Next.js** desplegado en Vercel con **Server Components +
Server Actions** como patrón principal. Base de datos **PostgreSQL en Neon**.
Storage de archivos en **Vercel Blob**. Auth con **NextAuth Credentials**.

Sin microservicios, sin CQRS, sin event sourcing. Diseño deliberadamente
simple para que pueda mantenerse con poco esfuerzo y entender en pocas
horas. Las queries hablan directo con Prisma desde server components; las
mutaciones usan server actions con validación Zod.

```
┌──────────────────────────────────────────────────────────────────┐
│                          NAVEGADOR                               │
│  (mobile-first · PWA-ready · navegación pública + login)         │
└────────────────────────┬─────────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                       VERCEL (Edge + Node)                       │
│  Next.js 16 · App Router · Server Components · Server Actions    │
│                                                                  │
│   ┌────────────────┐  ┌──────────────┐   ┌────────────────────┐  │
│   │  Sitio público │  │ Portal vecino│   │  Panel admin       │  │
│   │  /             │  │ /inicio      │   │  /admin/*          │  │
│   │  /nosotros     │  │ /mis-reclamos│   │  bandeja, expedien │  │
│   │  /audiencias   │  │ /reclamo/new │   │  documentos, etc.  │  │
│   │  /indicadores  │  │              │   │                    │  │
│   └───────┬────────┘  └──────┬───────┘   └─────────┬──────────┘  │
│           │                  │                     │             │
│           └──────────┬───────┴─────────────────────┘             │
│                      │                                           │
│                      ▼                                           │
│              ┌───────────────┐                                   │
│              │  Server Comp. │                                   │
│              │  Server Actions│                                  │
│              │  + lib/* helpers│                                 │
│              └───────┬────────┘                                  │
└──────────────────────┼───────────────────────────────────────────┘
                       │
       ┌───────────────┼────────────────────────┐
       ▼               ▼                        ▼
┌─────────────┐ ┌──────────────┐    ┌────────────────────────┐
│   Neon      │ │ Vercel Blob  │    │  Nominatim (OSM)       │
│  Postgres   │ │  Fotos/PDFs  │    │  Geocoding gratis      │
│             │ │              │    │  (rate-limited 1 req/s)│
└─────────────┘ └──────────────┘    └────────────────────────┘
```

## Decisiones técnicas

### Por qué Next.js (App Router)

- Un solo proyecto que sirve sitio público + páginas dinámicas + APIs.
- Server Components reducen JS enviado al navegador (importante para vecinos
  en 3G/4G de la Patagonia).
- Server Actions sustituyen el clásico flujo `useState + fetch + onSubmit`
  con código del lado servidor seguro y type-safe.
- Deploy a Vercel es un click.

### Por qué Prisma

- Migraciones versionadas en `prisma/migrations/` — todo el historial de
  cambios del schema está en git.
- Type-safe end-to-end: TypeScript sabe la forma de cada modelo y
  autocompleta.
- Cliente generado regenera tipos automáticamente en cada build.

### Por qué NextAuth Credentials

- No queremos Google/Microsoft/Facebook OAuth (el vecino no necesita
  cuenta de Google para reclamar).
- Login con DNI/CUIT + clave bcrypt es lo más cercano al modelo mental
  argentino.
- Migración futura a RENAPER cabe en el mismo flujo (callback custom).

### Por qué Leaflet + OpenStreetMap

- Sin API key, sin costo, sin límite de cargas.
- Google Maps cobraba ~7 USD por cada 1.000 cargas — descartado por
  regla de costo cero.
- Visualmente equivalente para Comodoro Rivadavia.

### Por qué Nominatim para geocoding

- Gratis sin API key.
- Rate limit 1 req/s — suficiente para creación de reclamos uno a uno.
- Fallback en cascada (5 estrategias) + centro de Comodoro con jitter como
  último recurso → ningún reclamo queda sin coordenadas.

### Por qué Vercel Blob para fotos

- Filesystem de Vercel es efímero (se borra en cada deploy).
- Vercel Blob persiste y se sirve por CDN.
- Tier gratis 1 GB suficiente para los primeros miles de fotos.
- Fallback a filesystem local en dev cuando no hay `BLOB_READ_WRITE_TOKEN`.

## Patrones del código

### Server Components leen, Server Actions escriben

```tsx
// Server Component (page.tsx)
export default async function Page() {
  const reclamos = await prisma.reclamo.findMany({ where: {...} });
  return <ListaReclamos reclamos={reclamos} />;
}

// Server Action
'use server';
export async function cambiarEstado(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Sin sesión');
  // ... validación Zod, mutación Prisma, revalidatePath
}
```

### Filtros por rol vía `whereReclamosByRol`

El helper `lib/admin.ts` devuelve el filtro Prisma correcto según el rol del
usuario logueado. El operador prestadora siempre ve únicamente sus
reclamos:

```ts
where: { ...baseWhere, ...whereReclamosByRol(session.user.rol, session.user.prestadoraId) }
```

### Tipos generados automáticamente desde Prisma

`@prisma/client` exporta `Reclamo`, `Usuario`, `Servicio`, `ServicioKind`,
`ReclamoEstado`, etc. Toda la app importa esos tipos directamente.

### Helpers en `/lib`

Cada dominio tiene su archivo de constantes y helpers:
`servicios.ts`, `admin.ts`, `documentos.ts`, `vencimientos.ts`,
`boletines.ts`, `audiencias.ts`, `expedientes.ts`. Mantiene los archivos
de página chicos y la lógica reutilizable.

## Modelos de datos (resumen)

14 modelos en `prisma/schema.prisma`:

| Modelo | Para qué |
| ------ | -------- |
| `Usuario` | Vecinos, gestores, operadores, super admin |
| `Servicio` | Los 4 servicios bajo control |
| `Prestadora` | CLEAR URBANA, SCPL, PATAGONIA, DIADEMA |
| `Reclamo` | Reclamo del vecino con foto/GPS/dirección |
| `ReclamoEvento` | Timeline del reclamo (cambios de estado, comentarios) |
| `Adjunto` | Fotos del reclamo (Vercel Blob URLs) |
| `Expediente` | Expediente administrativo del Ente |
| `ActoAdministrativo` | Actos dentro del expediente (intimación, resolución, etc.) |
| `Documento` | Documentación que las prestadoras suben al Ente |
| `Vencimiento` | Calendario de presentaciones obligatorias |
| `Boletin` | Comunicados, notas de prensa, clippings |
| `AudienciaPublica` | Audiencias del Ente |
| `InscripcionAudiencia` | Inscripciones ciudadanas a audiencias |
| `EncuestaServicios` | Respuestas anónimas a la encuesta general |

## Deploy y CI

- **Push a `main`** en GitHub → Vercel ejecuta automáticamente:
  1. `npm install`
  2. `prisma generate` (postinstall)
  3. `next build`
  4. Despliegue a la URL de producción

- No hay tests automatizados (pendiente).
- No hay CI separado (Vercel cumple el rol básico).

## Limitaciones conocidas

1. **Filesystem efímero en Vercel** — todo lo persistente va a Blob o DB.
2. **Sin tests** — un programador profesional probablemente quiera Vitest
   + Playwright.
3. **Sin observabilidad** — no hay Sentry, no hay analytics.
4. **Sin rate limiting custom** — Vercel ofrece básico pero no se aprovecha.
5. **Auth con clave temporal** — falta pantalla de cambio de contraseña
   y reset por email.
6. **Geocoding síncrono** — agrega ~1 segundo al crear un reclamo. Podría
   ser async (cola).
7. **Imágenes pesadas** — la foto panorámica son 8 MB en PNG; debería ser
   WebP ~500 KB.

## Roadmap (de mayor a menor prioridad)

Ver [`HANDOFF.md`](./HANDOFF.md) y el Word **Pendientes Portal ENCOSEP.docx**.
