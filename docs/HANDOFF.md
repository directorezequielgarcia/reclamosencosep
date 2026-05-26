# Handoff — Portal ENCOSEP

Documento operativo para que cualquier persona (técnica o no) pueda tomar
el portal y operar / migrar / mantener sin información oculta.

> ⚠️ Este archivo contiene **referencias a credenciales y servicios**. Los
> secretos reales viven en Vercel Settings → Environment Variables, no en
> el código. Este documento sólo lista qué existe y cómo se accede.

---

## 1. URLs y servicios

| Servicio | URL | Login |
| -------- | --- | ----- |
| **Portal en producción** | https://reclamosencosep.vercel.app | — |
| **Repositorio de código** | https://github.com/directorezequielgarcia/reclamosencosep | usuario `directorezequielgarcia` |
| **Hosting (Vercel)** | https://vercel.com/ezegarcia-s-projects/reclamosencosep | login con cuenta GitHub del Director |
| **Base de datos (Neon)** | https://console.neon.tech/ | accedida vía integración Vercel Storage |
| **Storage archivos (Vercel Blob)** | gestionado dentro de Vercel | env `BLOB_READ_WRITE_TOKEN` |
| **Geocoding (Nominatim OSM)** | https://nominatim.openstreetmap.org/ | sin API key |

---

## 2. Cuentas de usuarios productivos

### Equipo del Ente (todos `GESTOR_ENTE`, clave temporal `encosep-2026`)

| Persona | Rol institucional | DNI temporal |
| ------- | ----------------- | ------------ |
| Adriana Almonacid | Responsable Control Documental | 11111111 |
| Marcos Barrionuevo | Responsable Comunicación y Medios | 22222222 |
| Yanina del Bono | Responsable Gestión de Expedientes | 33333333 |
| Julieta Palacios | Responsable Inspecciones | 44444444 |

> **Pendiente:** reemplazar DNI temporales por reales.

### Directorio y demos (clave `demo1234`)

| Rol | Identificador |
| --- | ------------- |
| Super admin (Dr. Cr. Ezequiel García) | DNI 27345678 |
| Gestor del Ente demo | DNI 30111222 |
| Vecino demo | DNI 40555666 |
| Operadora SCPL demo | DNI 33444555 |

### Prestadoras (operadores)

| Empresa | CUIT (placeholder) | Clave |
| ------- | ------------------ | ----- |
| SCPL | 30528775409 | scpl-2026 |
| CLEAR URBANA | 30710000001 | clear-2026 |
| PATAGONIA Argentina | 30710000002 | patagonia-2026 |
| TRANSPORTE DIADEMA | 30710000003 | diadema-2026 |

> **Pendiente:** reemplazar CUITs por reales.

### Cambio de clave

Hoy no hay pantalla de **Cambiar mi contraseña**. Para cambiar la clave
de un usuario, ejecutar desde local:

```powershell
node -e "import('@prisma/client').then(async({PrismaClient})=>{const bcrypt=await import('bcryptjs');const p=new PrismaClient();await p.usuario.update({where:{dni:'11111111'},data:{passwordHash:await bcrypt.default.hash('NUEVA-CLAVE',10)}});await p['\$disconnect']();})"
```

(Reemplazar `11111111` y `NUEVA-CLAVE` por los valores reales.)

---

## 3. Variables de entorno

En Vercel → Project → Settings → Environment Variables están configuradas:

| Variable | Para qué |
| -------- | -------- |
| `DATABASE_URL` | Conexión pooled a Neon (uso runtime) |
| `DATABASE_URL_UNPOOLED` | Conexión directa para migraciones |
| `AUTH_SECRET` | Secreto JWT de NextAuth (256-bit base64) |
| `AUTH_URL` | URL del portal (auto-detectado en Vercel) |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob para upload de fotos |

Si hay que reconstruir el deploy desde cero:

1. Importar el repo a Vercel.
2. Crear Postgres en Vercel Storage → Neon (free).
3. Crear Blob en Vercel Storage → Blob (free, **público**).
4. Conectar ambos al proyecto (esto inyecta las variables automáticamente).
5. Agregar `AUTH_SECRET` manual (`npx auth secret` para generar).
6. Aplicar migraciones: `npx prisma migrate deploy`.
7. Seed: `npm run db:seed` + scripts ad-hoc en `/scripts/`.

---

## 4. Resguardo (backup)

### Lo que YA tiene backup automático

| Activo | Dónde | Frecuencia |
| ------ | ----- | ---------- |
| Código fuente | GitHub | Cada push |
| Base de datos | Neon (incluido en free tier) | Diaria |
| Archivos (fotos/PDFs) | Vercel Blob | Replicado por Vercel |

### Lo que se recomienda agregar

1. **Mirror del repo** en otro proveedor (Codeberg, GitLab, BitBucket).
   Crear cuenta gratis y configurar `git remote add mirror ...` + push
   manual periódico o action automática.

2. **Backup semanal de la base** a Drive del Ente:
   ```powershell
   node scripts/backup-db.mjs
   ```
   El script genera `backup-ENCOSEP-YYYY-MM-DD.sql` en la carpeta actual
   y se sube manualmente a Google Drive del Ente.

3. **Backup mensual completo** del proyecto:
   - Clonar repo
   - Dump de DB
   - Descarga de fotos del Blob (con script)
   - Empaquetar en ZIP
   - Guardar en disco externo + Google Drive

4. **Documento de credenciales** del Directorio (este HANDOFF.md + las
   contraseñas reales) en Bitwarden gratis del Ente, NO en este repo.

---

## 5. Dominio

Hoy el portal vive en `reclamosencosep.vercel.app`. Opciones para
migrar a un dominio institucional:

### Opción A — apuntar `encosepcomodoro.gob.ar` a Vercel

1. Pedir al IT del Municipio que en el panel de DNS del dominio
   agregue:
   - `A @ → 76.76.21.21` (IP de Vercel)
   - `CNAME www → cname.vercel-dns.com`
2. En Vercel → Project → Settings → Domains, agregar
   `encosepcomodoro.gob.ar`.
3. Vercel emite certificado SSL automático en minutos.

### Opción B — dominio propio `.com.ar`

1. Registrar `encosep.com.ar` (o similar) en https://nic.ar/
   (~AR$ 3.500/año).
2. Apuntar DNS a Vercel (mismo procedimiento que arriba).

### Opción C — quedarse en `.vercel.app`

Sin acción. Sirve mientras tanto.

---

## 6. Mantenimiento día a día

| Tarea | Quién | Cómo |
| ----- | ----- | ---- |
| Subir boletines | Marcos | `/admin/boletines` → form de alta |
| Crear audiencias | Marcos | `/admin/audiencias` (form alta + edición vía script por ahora) |
| Revisar documentación de prestadoras | Adriana | `/admin/documentacion` |
| Gestionar reclamos y expedientes | Yanina | `/admin/bandeja` y `/admin/expedientes` |
| Inspecciones, fotos al portal | Julieta | (futuro) `/admin/inspecciones` |
| Cargar fotos del directorio | Marcos | (futuro) CMS |

Todo el equipo entra al panel admin con su DNI/clave y trabaja desde la
interfaz sin tocar código.

---

## 7. Quién toma decisiones

| Decisión | Responsable |
| -------- | ----------- |
| Funcionalidades nuevas | Directorio + Director Técnico (Dr. García) |
| Dominio definitivo | Directorio + IT Municipio |
| Cambios de stack o proveedor | Director Técnico |
| Mantenimiento operativo | Equipo del Ente con autonomía sobre interfaz |

---

## 8. Pendientes priorizados

Ver el documento **Pendientes Portal ENCOSEP.docx** generado y resguardado
en la carpeta de archivo del Ente. Lista completa de 24 items en cuatro
niveles de prioridad, con esfuerzo estimado y responsable de aportar
información de cada uno.

---

## 9. Soporte

Cualquier persona que tome el proyecto puede:

1. Leer este documento + `README.md` + `ARCHITECTURE.md`.
2. Clonar el repo, seguir el setup local, levantar `npm run dev`.
3. Revisar el código en orden: `app/(sitio)/page.tsx`, luego
   `app/(ciudadano)/`, luego `app/admin/`.
4. Inspeccionar la base con `npx prisma studio`.
5. Hacer cambios → commit → push → deploy automático.

Si surge bloqueo, las opciones son:

- **Conmigo (Claude)** en sesiones de Claude Code, sin costo.
- **Programador externo** — el código sigue estándares Next.js/TypeScript
  habituales; cualquier dev junior+ puede tomarlo.

---

*Documento generado para uso interno del ENCOSEP — Comodoro Rivadavia,
Chubut. Última actualización: ver fecha del commit.*
