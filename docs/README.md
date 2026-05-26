# Portal ENCOSEP — Documentación técnica

Portal digital del **Ente de Control de los Servicios Públicos** de Comodoro
Rivadavia, Chubut. Plataforma única que integra sitio institucional, portal
de reclamos del vecino, panel administrativo del Ente y módulos de gestión
para las prestadoras.

> **Producción:** https://reclamosencosep.vercel.app
> **Repo:** https://github.com/directorezequielgarcia/reclamosencosep
> **Estado:** En producción · MVP funcional · Costo cero

---

## Stack

| Capa | Tecnología | Versión | Por qué |
| ---- | ---------- | ------- | ------- |
| Framework | Next.js (App Router) | 16 | SSR + RSC + API routes en un solo proyecto |
| Lenguaje | TypeScript | 5 | Type safety end-to-end |
| UI | React + Tailwind CSS | 19 / v4 | Componentes modernos, design system rápido |
| ORM | Prisma | 6 | Type-safe queries, migraciones versionadas |
| Base de datos | PostgreSQL (Neon) | — | Tier gratis 0.5 GB |
| Auth | NextAuth.js (Auth.js) | 5 beta | Credentials (DNI/CUIT + password bcrypt) |
| Storage de archivos | Vercel Blob | — | Free 1 GB · CDN integrado |
| Mapas | Leaflet + OpenStreetMap | 1.9 | Sin API key, gratis ilimitado |
| Heatmap | leaflet.heat | — | Plugin oficial Leaflet |
| Geocoding | Nominatim (OSM) | — | Gratis, sin API key |
| Hosting | Vercel | — | Auto-deploy desde GitHub, free tier |

**Regla institucional:** todo gratuito. Sin servicios pagos, sin licencias.

---

## Setup local

### Requisitos

- Node.js **20+** (probado en 24.16)
- Git
- Cuenta de GitHub (para clonar)

### Instalación

```powershell
git clone https://github.com/directorezequielgarcia/reclamosencosep.git
cd reclamosencosep
npm install
```

### Variables de entorno

Copiar `.env.example` a `.env` y completar:

```env
# Base de datos PostgreSQL (Neon)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@host-unpooled/db?sslmode=require"

# NextAuth
AUTH_SECRET="generar con: npx auth secret"
AUTH_URL="http://localhost:3000"

# Vercel Blob (opcional en dev — sin esto se cae al filesystem)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxx"
```

Las credenciales reales viven en **Vercel → Settings → Environment Variables**.

### Comandos disponibles

```powershell
npm run dev          # servidor de desarrollo (localhost:3000)
npm run build        # build de producción
npm run start        # servir build local
npm run lint         # linter
npm run db:migrate   # aplicar migraciones pendientes
npm run db:seed      # cargar servicios + prestadoras + usuarios demo
npm run db:studio    # abrir Prisma Studio (GUI de la DB)
```

### Primera vez: poblar la base

```powershell
npx prisma migrate dev          # crea las tablas
npm run db:seed                 # carga servicios, prestadoras y usuarios demo
node scripts/crear-colaboradores.mjs       # 4 usuarios del Ente
node scripts/crear-operadores-prestadoras.mjs  # operadores SCPL/CLEAR/PATAGONIA/DIADEMA
node scripts/cargar-audiencia-readecuacion-scpl.mjs  # audiencia de ejemplo
```

---

## Estructura del proyecto

```
reclamos-app/
├─ app/                          → Rutas Next.js (App Router)
│  ├─ (sitio)/                   → Páginas públicas con layout institucional
│  │  ├─ page.tsx                → Home con hero
│  │  ├─ nosotros/               → Directorio + organigrama + plan estratégico
│  │  ├─ acciones/               → Galería de acciones del Ente
│  │  ├─ atencion-usuarios/      → Hub de atención al vecino
│  │  ├─ control-prestadoras/    → Normativa por servicio
│  │  ├─ boletines/              → Comunicados públicos
│  │  ├─ audiencias/             → Audiencias con inscripción ciudadana
│  │  ├─ indicadores/            → Dashboard tiempo real (mapa de calor)
│  │  ├─ encuesta/               → Encuesta general de servicios
│  │  ├─ areas-fiscalizadas/[svc]/  → Detalle por servicio
│  │  ├─ reclamos/               → Landing del portal de reclamos
│  │  ├─ prestadoras/            → Landing del portal de prestadoras
│  │  └─ contacto/
│  ├─ (ciudadano)/               → Portal del vecino logueado
│  │  ├─ inicio/
│  │  ├─ reclamo/nuevo/          → Wizard de reclamo (foto, GPS, dirección)
│  │  └─ mis-reclamos/[codigo]/  → Detalle con timeline + acciones
│  ├─ admin/                     → Panel del Ente y prestadoras
│  │  ├─ page.tsx                → Dashboard
│  │  ├─ bandeja/                → Lista de reclamos
│  │  ├─ reclamo/[id]/           → Detalle con expediente
│  │  ├─ expedientes/            → Expedientes administrativos
│  │  ├─ documentacion/          → Documentación prestadoras + revisión
│  │  ├─ vencimientos/           → Calendario de presentaciones
│  │  ├─ boletines/              → CRUD boletines
│  │  └─ audiencias/             → Crear / editar / inscriptos
│  ├─ api/
│  │  ├─ auth/[...nextauth]/     → NextAuth handlers
│  │  └─ reclamos/               → Crear reclamo (multipart con foto)
│  └─ ingresar/                  → Login universal (DNI o CUIT)
├─ components/
│  ├─ ui/                        → Header, footer, badges, logos, banda
│  ├─ servicios/                 → SvcIcon, BotoneraServicios
│  └─ mapa/                      → MiniMapa + MapaCalor
├─ lib/                          → Lógica reutilizable
│  ├─ prisma.ts                  → Cliente Prisma singleton
│  ├─ auth.ts                    → Config NextAuth
│  ├─ servicios.ts               → Metadatos de servicios
│  ├─ admin.ts                   → Helpers de roles, estados
│  ├─ documentos.ts              → Helpers documentación
│  ├─ vencimientos.ts            → Helpers vencimientos
│  ├─ boletines.ts               → Helpers boletines
│  ├─ audiencias.ts              → Helpers audiencias
│  ├─ expedientes.ts             → Helpers expedientes
│  ├─ uploads.ts                 → Upload a Vercel Blob (con fallback fs)
│  ├─ geocode.ts                 → Nominatim + fallback centro Comodoro
│  └─ codigos.ts                 → Generador de códigos de reclamo
├─ prisma/
│  ├─ schema.prisma              → 14 modelos
│  ├─ migrations/                → Migraciones versionadas (8)
│  └─ seed.ts                    → Seed inicial
├─ public/                       → Assets estáticos (imágenes, PDFs)
│  ├─ imagenes/                  → Logo, hero, organigrama, banners
│  ├─ acciones/                  → Fotos y videos institucionales
│  └─ audiencias/                → PDFs de audiencias (expedientes, OD, actas)
├─ scripts/                      → Scripts admin para ejecutar manual
│  ├─ crear-colaboradores.mjs
│  ├─ crear-operadores-prestadoras.mjs
│  ├─ cargar-audiencia-readecuacion-scpl.mjs
│  ├─ geocodificar-reclamos-existentes.mjs
│  ├─ inspeccionar-reclamos.mjs
│  └─ backup-db.mjs              → Backup semanal de la DB
└─ docs/                         → Esta documentación
   ├─ README.md
   ├─ ARCHITECTURE.md
   └─ HANDOFF.md
```

---

## Roles del sistema

| Rol enum | Quién | Permisos clave |
| -------- | ----- | -------------- |
| `CIUDADANO` | Vecino logueado | Crear reclamos, ver los suyos, recurso directo, copia expediente |
| `OPERADOR_PRESTADORA` | Empresa controlada (login con CUIT) | Ver sólo SUS reclamos, cambiar estado, presentar descargos, subir documentación |
| `GESTOR_ENTE` | Equipo del Ente (Adriana, Marcos, Yanina, Julieta) | Ver todo, asignar, derivar, elevar a expediente, revisar documentación, crear audiencias, publicar boletines |
| `SUPER_ADMIN` | Directorio | Todo lo del Gestor + gestión de usuarios + configuración |
| `AUDITOR` | (reservado) | Sólo lectura |

---

## Más documentación

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — decisiones técnicas y arquitectura
- [`HANDOFF.md`](./HANDOFF.md) — credenciales, servicios, dominios
- [`normativa.md`](./normativa.md) — relevamiento de normativa del Digesto

---

**Mantenedor actual:** Dr. Cr. Ezequiel García · Director ENCOSEP
