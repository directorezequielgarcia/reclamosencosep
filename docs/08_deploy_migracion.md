# 08 — Deploy y migración de base de datos

## Correr el proyecto localmente

### Prerrequisitos
- Node.js 20+
- PostgreSQL local (o una DB en Neon/Supabase para dev)
- Git

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar y completar variables de entorno
cp .env.example .env
# Editar .env con los valores reales (ver docs/07_variables_entorno.md)

# 3. Aplicar migraciones a la DB de desarrollo
npm run db:migrate   # equivale a: npx prisma migrate dev

# 4. (Opcional) Cargar datos iniciales
npm run db:seed      # equivale a: npx tsx prisma/seed.ts

# 5. Abrir Prisma Studio para explorar la DB
npm run db:studio    # equivale a: npx prisma studio

# 6. Iniciar el servidor de desarrollo
npm run dev          # disponible en http://localhost:3000
```

`npm run db:migrate` en modo dev crea las migraciones pendientes y las aplica. En producción se usa `prisma migrate deploy` (ver abajo).

---

## Deploy en Vercel

El proyecto está configurado para deploy continuo en Vercel:

1. Cada push a la rama principal dispara un nuevo build automáticamente.
2. El script `build` en `package.json` es `prisma generate && next build`. Prisma genera el cliente antes del build de Next.js.
3. El script `postinstall` también ejecuta `prisma generate` para que funcione en entornos CI/CD que solo corren `npm install`.
4. Las migraciones **no se aplican automáticamente en build**. Hay que ejecutarlas manualmente o agregar un step en el pipeline (ver nota más abajo).

### Aplicar migraciones en producción (Vercel)

Opción A — manualmente desde la máquina de desarrollo:
```bash
DATABASE_URL="<url-de-produccion>" npx prisma migrate deploy
```

Opción B — agregar un script de release en Vercel (`vercel.json`):
```json
{
  "buildCommand": "prisma migrate deploy && prisma generate && next build"
}
```

`prisma migrate deploy` (a diferencia de `migrate dev`) aplica las migraciones pendientes sin crear nuevas ni pedir confirmación. Es seguro para CI/CD.

---

## Guía paso a paso: migrar a PostgreSQL propio

El objetivo es reemplazar Neon (PostgreSQL serverless gratuito con limitaciones) por un PostgreSQL propio sin cambiar una línea de código de la aplicación.

### Paso 1 — Elegir y provisionar el nuevo PostgreSQL

Opciones recomendadas con plan gratuito:

| Proveedor | Plan gratuito | Notas |
|---|---|---|
| **Supabase** | 500 MB, 2 proyectos | PostgreSQL 15, incluye pooler (Supavisor), Storage opcional |
| **Railway** | $5 crédito mensual gratis | PostgreSQL directo, fácil de usar |
| **Render** | Gratuito con limitaciones | Duerme después de inactividad |
| **VPS propio + Docker** | Costo del servidor | Control total, sin límites de proveedor |

Con Docker en VPS:
```bash
docker run -d \
  --name encosep-pg \
  -e POSTGRES_PASSWORD=clave_segura \
  -e POSTGRES_DB=encosep_reclamos \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16
```

### Paso 2 — Hacer backup de los datos actuales en Neon

Antes de migrar, exportar los datos de la DB de Neon:

```bash
# Usando pg_dump con la URL de Neon (directa, sin pooler)
pg_dump \
  --no-acl --no-owner \
  "postgresql://user:pass@ep-xxx.neon.tech/encosep_reclamos?sslmode=require" \
  -Fc -f backup_neon_$(date +%Y%m%d).dump
```

Guardar el archivo `.dump` en un lugar seguro. Contiene tanto el schema como los datos.

Si no se tiene `pg_dump` instalado, Neon tiene una opción de export en el dashboard: `Project > Branches > Export`.

### Paso 3 — Actualizar las variables de entorno

En el dashboard de Vercel (`Settings > Environment Variables`), actualizar:

```
DATABASE_URL       → URL del nuevo PostgreSQL (con pooler si tiene uno)
DATABASE_URL_UNPOOLED → URL directa del nuevo PostgreSQL
```

Para producción, también actualizar en el archivo `.env.local` si se trabaja localmente contra la nueva DB.

### Paso 4 — Aplicar las migraciones al nuevo PostgreSQL

La nueva DB está vacía. Prisma aplicará todas las migraciones en orden:

```bash
# Apuntando a la nueva DB
DATABASE_URL_UNPOOLED="<url-directa-nueva-db>" npx prisma migrate deploy
```

Usar `DATABASE_URL_UNPOOLED` (conexión directa) porque Prisma necesita una conexión sin pooler para ejecutar DDL. Si el nuevo PostgreSQL no tiene pooler, usar la misma URL en ambas variables.

Verificar el resultado:
```bash
DATABASE_URL_UNPOOLED="<url-directa-nueva-db>" npx prisma migrate status
```
Debe mostrar todas las migraciones como aplicadas.

### Paso 5 — Restaurar los datos desde el backup de Neon

```bash
# Restaurar el dump en la nueva DB
pg_restore \
  --no-acl --no-owner \
  -d "postgresql://user:pass@nuevo-host:5432/encosep_reclamos" \
  backup_neon_20260616.dump
```

Alternativamente, si se usó `pg_dump -Fp` (texto plano):
```bash
psql "postgresql://user:pass@nuevo-host:5432/encosep_reclamos" < backup_neon_20260616.sql
```

**Nota sobre el seed**: `prisma db seed` solo es necesario si la nueva DB está vacía y se quiere cargar los datos iniciales de configuración (servicios, prestadoras de ejemplo, usuarios iniciales). Si se restauró el backup completo de Neon, no hace falta ejecutar el seed.

### Paso 6 — Migrar los archivos binarios (si aplica)

Si se estaban guardando archivos en la tabla `ArchivoBlob`, esos datos se transfieren automáticamente con el backup de la DB.

Si se estaba usando Vercel Blob, los archivos permanecen en Vercel Blob y las URLs en la DB siguen siendo válidas. No hay que migrar archivos.

Si se migra de `ArchivoBlob` a un storage propio (S3, Supabase Storage, etc.):
1. Exportar todos los registros de `ArchivoBlob` con un script que lea `contenido` y los suba al nuevo storage.
2. Actualizar el campo `archivoUrl` de cada `Documento` con la nueva URL.
3. Actualizar `lib/uploads.ts` para usar el nuevo storage.

### Paso 7 — Verificar en producción

1. Triggerear un nuevo deploy en Vercel (o hacer un push vacío) para que tome las nuevas variables de entorno.
2. Verificar que la app carga correctamente en `https://reclamosencosep.vercel.app`.
3. Hacer un login de prueba.
4. Verificar que los reclamos, documentos y expedientes existentes sean accesibles.
5. Subir un documento de prueba para verificar que la escritura funciona.
6. Si todo está bien, la DB de Neon puede dejarse en modo read-only o eliminar el proyecto.

---

## Notas adicionales

### Sin cambios de código necesarios
Prisma abstrae completamente el motor de PostgreSQL. Las queries, el schema y toda la lógica de negocio son idénticos en Neon, Supabase, Railway o un VPS con Docker. La migración es exclusivamente de infraestructura.

### SSL
La mayoría de los proveedores cloud requieren `?sslmode=require` al final de la URL de conexión. Verificar si el proveedor elegido lo requiere.

### Prisma Accelerate
Si en el futuro se quiere agregar caching de queries a nivel de ORM, Prisma Accelerate es una opción. Requiere cambiar `DATABASE_URL` para apuntar al proxy de Accelerate. No está implementado actualmente.
