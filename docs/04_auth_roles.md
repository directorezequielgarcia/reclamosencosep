# 04 — Autenticación y roles

## Configuración NextAuth

Archivo: `lib/auth.ts`

- **Versión**: NextAuth v5 (beta).
- **Estrategia de sesión**: JWT (no hay tabla de sesiones en DB).
- **Provider**: `Credentials` — login por DNI + password.
- **Página de login custom**: `/ingresar`.

El JWT incluye los campos extendidos: `id`, `dni`, `rol`, `prestadoraId`. Estos se mapean a `session.user` a través de los callbacks `jwt` y `session`.

El handler HTTP está en `app/api/auth/[...nextauth]/route.ts` (solo re-exporta `handlers` de `lib/auth.ts`).

---

## Flujo de autenticación paso a paso

1. El usuario accede a `/ingresar` y envía el formulario con DNI y password.
2. NextAuth llama a `authorize()` del provider `Credentials`.
3. Se valida el input con Zod (`CredentialsSchema`: DNI de 6-12 caracteres, password de mínimo 4).
4. Se normaliza el DNI (se quitan puntos y espacios) y se busca en `Usuario.dni`.
5. Si el usuario no existe o `activo === false`, se devuelve `null` (login rechazado).
6. Se compara la password enviada con `passwordHash` usando `bcrypt.compare`.
7. Si es correcto, se devuelve el objeto de usuario que NextAuth incluirá en el JWT.
8. El JWT se almacena en una cookie HttpOnly (`next-auth.session-token`).
9. Cada Server Component o Server Action que necesita la sesión llama a `auth()` (importado de `lib/auth.ts`), que decodifica el JWT sin ir a la DB.
10. El layout `app/admin/layout.tsx` verifica la sesión y redirige a `/ingresar` si no hay sesión válida.

**Reset de password**: el modelo `Usuario` tiene los campos `passwordResetToken` y `passwordResetExpires`. El flujo está en `app/olvide-clave/` y `app/restablecer-clave/` con envío de email vía `lib/email.ts` (Nodemailer).

---

## Roles

El enum `Rol` tiene 13 valores. Se define en `prisma/schema.prisma` y su etiqueta legible en `lib/admin.ts` (`ROL_LABEL`).

### Roles del equipo ENCOSEP

| Rol | Etiqueta | Descripción |
|---|---|---|
| `DIRECTOR` | Director del Ente | Directorio (Serdeiro, García, López). Ve y opera todo. Único que exporta informes oficiales. |
| `SUPER_ADMIN` | Director técnico | Administrador técnico del sistema. Equivalente a Dirección en permisos. Gestiona usuarios. |
| `GESTOR_ENTE` | Gestor del Ente | Rol legacy general. Puede hacer casi todo dentro del admin. Se usa para compatibilidad. |
| `COOPERATIVA_DOCS` | Documentación de prestadoras | Adriana: sube y revisa documentación de prestadoras, gestiona vencimientos. |
| `EXPEDIENTES` | Expedientes | Yanina: gestiona expedientes administrativos. También ve reclamos e inspecciones vinculadas. |
| `INSPECCIONES` | Inspecciones de campo | Julieta: crea, edita y publica inspecciones de campo. |
| `AUDIENCIAS_MEDIOS` | Audiencias y medios | Marcos: gestiona audiencias públicas y boletines/clipping de medios. |
| `AUDITOR` | Auditor | Acceso de lectura amplio: ve documentos, expedientes e inspecciones. No puede modificar. |

### Roles de prestadoras

| Rol | Etiqueta | Descripción |
|---|---|---|
| `OPERADOR_PRESTADORA` | Operador prestadora | Empleado de una prestadora. Ve solo los reclamos y documentos de su empresa (filtrado por `prestadoraId`). |

### Roles ciudadanos

| Rol | Etiqueta | Descripción |
|---|---|---|
| `CIUDADANO` | Vecino | Portal ciudadano: carga reclamos, ve sus reclamos. No accede al panel admin. |

### Roles institucionales externos (consulta)

| Rol | Etiqueta | Descripción |
|---|---|---|
| `PEM` | Poder Ejecutivo Municipal | Acceso de lectura a indicadores, reportes y agenda. |
| `CONCEJO_DELIBERANTE` | Concejo Deliberante | Acceso de lectura a indicadores, problemas por barrio, audiencias y notas. |
| `AUTORIDAD_APLICACION` | Autoridad de Aplicación | Acceso a expedientes, recomendaciones y normativa. Es quien aplica sanciones. |

---

## Acceso al panel `/admin`

La constante `ROLES_ADMIN` (en `lib/admin.ts`) lista los roles que pueden acceder al panel admin:

```
GESTOR_ENTE | OPERADOR_PRESTADORA | SUPER_ADMIN | AUDITOR
DIRECTOR | COOPERATIVA_DOCS | EXPEDIENTES | INSPECCIONES | AUDIENCIAS_MEDIOS
```

`CIUDADANO`, `PEM`, `CONCEJO_DELIBERANTE` y `AUTORIDAD_APLICACION` no están en esta lista. Los tres últimos tienen un acceso institucional separado (pendiente de implementar como módulo de consulta).

---

## Funciones helper de permisos (`lib/admin.ts`)

| Función | Quién puede |
|---|---|
| `esDireccion(rol)` | `DIRECTOR` o `SUPER_ADMIN` |
| `puedeExportarInformes(rol)` | Solo Dirección |
| `puedeRevisarDocumentos(rol)` | Dirección + `COOPERATIVA_DOCS` + `GESTOR_ENTE` |
| `puedeVerDocumentos(rol)` | Anteriores + `OPERADOR_PRESTADORA` + `AUDITOR` |
| `puedeGestionarExpedientes(rol)` | Dirección + `EXPEDIENTES` + `GESTOR_ENTE` |
| `puedeVerExpedientes(rol)` | Anteriores + `AUDITOR` |
| `puedeGestionarInspecciones(rol)` | Dirección + `INSPECCIONES` + `GESTOR_ENTE` |
| `puedeVerInspecciones(rol)` | Anteriores + `EXPEDIENTES` + `AUDITOR` |
| `puedeGestionarAudienciasMedios(rol)` | Dirección + `AUDIENCIAS_MEDIOS` + `GESTOR_ENTE` |
| `puedeGestionarUsuarios(rol)` | Dirección + `GESTOR_ENTE` |
| `puedeGestionarReclamos(rol)` | Dirección + `GESTOR_ENTE` + `EXPEDIENTES` |
| `puedeGestionarVencimientos(rol)` | Dirección + `COOPERATIVA_DOCS` + `GESTOR_ENTE` |
| `puedeGestionarTarifas(rol)` | Dirección + `GESTOR_ENTE` |

**Filtros Prisma por rol**:
- `whereReclamosByRol`: el `OPERADOR_PRESTADORA` solo ve reclamos de su `prestadoraId`.
- La misma lógica se aplica en documentos: el operador solo accede a documentos de su prestadora (verificado en la API route de archivos).

---

## Cómo crear usuarios

**Opción 1 — Script de seed** (`prisma/seed.ts`):
Crea los usuarios iniciales del sistema (directores, operadores de prestadoras, etc.) con passwords hasheadas. Se ejecuta con:
```bash
npm run db:seed
# o: npx tsx prisma/seed.ts
```

**Opción 2 — Panel admin** (`/admin/usuarios`):
Los roles `DIRECTOR`, `SUPER_ADMIN` y `GESTOR_ENTE` pueden crear usuarios desde la interfaz. El formulario hashea la password antes de guardar.

---

## Rutas protegidas

- `/admin/*`: requieren sesión activa (verificada en `app/admin/layout.tsx`).
- `/mi-cuenta`: requiere sesión activa.
- `/admin/usuarios`: requiere `puedeGestionarUsuarios(rol) === true`.
- Los módulos funcionales verifican el permiso específico al comienzo de cada Server Action y en el layout/page correspondiente.

Las API routes verifican la sesión con `auth()` al inicio de cada handler y devuelven 401 si no hay sesión o 403 si el rol no tiene acceso.
