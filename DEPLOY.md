# Deploy a Vercel + Neon Postgres

## Prerequisitos
- Cuenta GitHub (gratis)
- Cuenta Vercel (gratis, login con GitHub)
- Repo de este proyecto en GitHub

## Pasos

### 1) Crear proyecto en Vercel
- Importar el repositorio de GitHub.
- Framework preset: Next.js (detectado automáticamente).
- Root directory: `./`
- Build command: `npm run build` (default).

### 2) Crear base de datos Postgres
- En el dashboard del proyecto en Vercel → **Storage** → **Create Database** → **Marketplace** → **Neon**.
- Plan free.
- Vercel inyecta automáticamente la variable `DATABASE_URL` y otras (`POSTGRES_*`).

### 3) Variables de entorno
En Settings → Environment Variables, agregar:

| Variable        | Valor                                          |
| --------------- | ---------------------------------------------- |
| `AUTH_SECRET`   | generar con `npx auth secret` (32+ chars)       |
| `AUTH_URL`      | URL definitiva (`https://reclamos-encosep.vercel.app`) |
| `DATABASE_URL`  | ya inyectada por la integración con Neon       |

### 4) Migrar el schema en producción
Después del primer deploy, correr una vez desde local apuntando a la DB de Neon:

```powershell
$env:DATABASE_URL = "postgresql://..."   # tomar de Vercel → Settings → Env
npx prisma migrate deploy
npm run db:seed
```

### 5) Listo
La URL queda activa. Cualquier push a `main` re-deploya automático.

## Limitaciones del tier gratis
- **Fotos**: el filesystem de Vercel es efímero. Las fotos subidas se pierden
  en cada deploy. Para producción real, integrar S3 / Cloudinary / Vercel Blob.
- **Compute**: 100GB-h/mes incluidos, suficiente para demo y prueba.
- **Postgres (Neon free)**: 0.5GB de storage, suficiente para los primeros
  cientos de reclamos.

## Volver a SQLite para dev local (opcional)
Si querés volver a usar SQLite en local en vez de conectar a Neon:
1. En `prisma/schema.prisma` cambiar `provider = "sqlite"`.
2. En `.env` poner `DATABASE_URL="file:./dev.db"`.
3. Borrar `prisma/migrations/` y re-correr `npx prisma migrate dev`.
