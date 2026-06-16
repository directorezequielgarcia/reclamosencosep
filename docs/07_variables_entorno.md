# 07 — Variables de entorno

## Tabla completa

| Variable | Descripción | Ejemplo | Obligatoria |
|---|---|---|---|
| `DATABASE_URL` | URL de conexión PostgreSQL **con pooler** (PgBouncer). Usada por Prisma en runtime. | `postgresql://user:pass@host:5432/encosep?sslmode=require` | Sí |
| `DATABASE_URL_UNPOOLED` | URL de conexión PostgreSQL **directa**, sin pooler. Necesaria para `prisma migrate deploy` y operaciones DDL. En Neon son dos URLs distintas. En un PostgreSQL estándar puede ser la misma que `DATABASE_URL`. | `postgresql://user:pass@host:5432/encosep?sslmode=require` | Sí (en Neon); puede igualarse a `DATABASE_URL` en PG propio |
| `AUTH_SECRET` | Clave secreta para firmar y verificar los JWTs de NextAuth. Debe ser larga y aleatoria. Generarla con `npx auth secret` o `openssl rand -base64 32`. | `Kx9mP2...` (string de 44+ chars) | Sí |
| `AUTH_URL` | URL base de la aplicación. NextAuth la usa para construir las URLs de callback. En Vercel se setea automáticamente como `NEXTAUTH_URL` en algunas versiones, pero NextAuth v5 usa `AUTH_URL`. | `https://reclamosencosep.vercel.app` (prod) / `http://localhost:3000` (dev) | Sí |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob para almacenamiento de archivos en CDN. **Opcional**: si no está definida, los archivos se guardan en la tabla `ArchivoBlob` de la DB. | `vercel_blob_rw_...` | No |

### Variables adicionales inferidas (email)

El módulo de email (`lib/email.ts`, Nodemailer) requiere configuración SMTP. Verificar en el código las variables que usa; típicamente:

| Variable | Descripción |
|---|---|
| `EMAIL_HOST` o similar | Servidor SMTP |
| `EMAIL_USER` | Usuario SMTP |
| `EMAIL_PASS` | Password SMTP |

Revisar `lib/email.ts` para los nombres exactos. El reset de password depende de esta configuración.

---

## Diferencias entre entornos

### Desarrollo local (`.env` o `.env.local`)

```env
# Copiar desde .env.example y completar
DATABASE_URL="postgresql://usuario:pass@localhost:5432/encosep_dev"
DATABASE_URL_UNPOOLED="postgresql://usuario:pass@localhost:5432/encosep_dev"
AUTH_SECRET="cualquier-string-largo-para-dev"
AUTH_URL="http://localhost:3000"
# BLOB_READ_WRITE_TOKEN se omite → archivos en public/uploads/ (filesystem local)
```

En dev, `DATABASE_URL` y `DATABASE_URL_UNPOOLED` pueden ser la misma URL de conexión directa (no hay pooler en PostgreSQL local).

### Producción en Vercel

Las variables se configuran en el dashboard de Vercel: `Settings > Environment Variables`.

Neon (si se sigue usando) provee automáticamente `DATABASE_URL` con pooler y `DATABASE_URL_UNPOOLED` directa cuando se integra via la Vercel Marketplace integration. Si se migra a PostgreSQL propio, hay que setearlas manualmente.

`AUTH_URL` en Vercel debe apuntar a la URL de producción (`https://reclamosencosep.vercel.app`). En algunos deploys, Vercel inyecta `VERCEL_URL` automáticamente, pero NextAuth v5 usa `AUTH_URL`.

### PostgreSQL propio (migración)

Con un PostgreSQL propio (Supabase, Railway, Render, VPS con Docker), las variables cambian:

```env
# Con pooler (PgBouncer):
DATABASE_URL="postgresql://user:pass@pooler-host:6543/encosep?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@direct-host:5432/encosep?sslmode=require"

# Sin pooler (PostgreSQL directo):
DATABASE_URL="postgresql://user:pass@host:5432/encosep?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@host:5432/encosep?sslmode=require"
```

Si el nuevo PostgreSQL no usa PgBouncer, ambas variables pueden tener el mismo valor.

---

## Cómo verificar la configuración

Después de configurar las variables, verificar la conexión con:

```bash
npx prisma db pull   # introspect la DB existente (solo para verificar conectividad)
# o:
npx prisma migrate status  # ver estado de migraciones sin aplicar nada
```
