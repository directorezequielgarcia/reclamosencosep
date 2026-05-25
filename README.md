# Portal de Reclamos ENCOSEP

Aplicación web (PWA mobile-first para vecinos + panel admin para gestores y
prestadoras) del **Ente de Control de Servicios Públicos** de Comodoro
Rivadavia.

> Estado: MVP en desarrollo · iniciativa aprobada por el Directorio (2026-05).

## Servicios bajo control

| Servicio        | Prestador                            |
| --------------- | ------------------------------------ |
| Higiene Urbana  | CLEAR URBANA S.A.                    |
| Energía y AP    | SCPL                                 |
| Transporte      | PATAGONIA ARGENTINA S.R.L. · DIADEMA |
| Agua y cloacas  | SCPL                                 |

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Prisma** + **SQLite** en dev (Postgres en prod)
- **NextAuth 5** (Credentials: DNI + clave)
- **Leaflet** (mapas)
- Almacenamiento de adjuntos: filesystem en dev, S3-compatible en prod

## Estructura

```
app/
  (ciudadano)/      — PWA del vecino: login, home, alta, seguimiento
  admin/            — panel institucional: bandeja, detalle, mapa, métricas
  api/              — endpoints internos
components/
lib/                — db, auth, utils
prisma/
  schema.prisma
  dev.db            — SQLite local (no commitear)
docs/
  diseno/           — prototipo Claude Design original (referencia visual)
public/
```

## Levantar en local

```powershell
# 1) Instalar dependencias (solo la primera vez)
npm install

# 2) Crear la base de datos local y aplicar el schema
npx prisma migrate dev --name init

# 3) Cargar datos semilla (servicios, prestadoras, usuarios demo)
npm run db:seed

# 4) Servidor de desarrollo
npm run dev
```

Abrir <http://localhost:3000>.

## Roles del sistema

- **Ciudadano** — registra reclamos, ve los suyos y el mapa público.
- **Gestor del Ente** — recibe, revisa, asigna y cierra reclamos.
- **Operador prestadora** — solo ve los reclamos asignados a su empresa.
- **Super admin** — configura el sistema, audita logs.
- **Auditor** — solo lectura: métricas + reclamos cerrados.

## Diseño de referencia

El prototipo hi-fi (Claude Design) vive en `docs/diseno/`. Es la guía visual
autoritativa. Para cada pantalla del producto existe una o varias variantes
A/B/C/D en ese prototipo — la elección final se acuerda con el Directorio antes
de implementar.

## Roadmap MVP

- **M1 (sem 1-2)** Cimientos: stack, design system, modelo de datos, auth.
- **M2 (sem 3-5)** Flujo del ciudadano end-to-end.
- **M3 (sem 6-8)** Panel admin: bandeja, detalle, asignación, dashboard.
- **M4 (sem 9-10)** Mapa público, analítica básica, PWA instalable.
- **M5 (sem 11-12)** Deploy a staging, dominio, observabilidad, hardening.

## Decisiones diferidas (post-MVP)

- Integración real con **RENAPER** para validar DNI (M1 usa DNI + clave).
- Notificaciones por **WhatsApp Business API** (M1 usa email).
- App nativa para tiendas (Play / App Store) — primero confirmamos adopción
  como PWA.
