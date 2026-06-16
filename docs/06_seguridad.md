# 06 — Seguridad

## Lo que ya está implementado

### Autenticación
- **JWT HttpOnly**: NextAuth almacena la sesión en una cookie HttpOnly firmada con `AUTH_SECRET`. El token no es accesible desde JavaScript del cliente.
- **bcryptjs**: las passwords se almacenan hasheadas con bcrypt (sal automática). Nunca se guarda la password en texto plano.
- **Login por DNI**: el identificador de login es el DNI, no el email, lo que reduce la superficie de ataque frente a credential-stuffing desde filtraciones externas.
- **Bloqueo de usuario**: el campo `activo: Boolean` en `Usuario` permite bloquear un usuario sin eliminarlo. El login lo verifica (`if (!u || !u.activo) return null`).

### Autorización
- **Roles granulares**: 13 roles con funciones helper específicas (`lib/admin.ts`). Cada Server Action y API route verifica el rol al inicio.
- **Filtros por prestadora**: `OPERADOR_PRESTADORA` ve exclusivamente los datos de su empresa. El filtro se aplica tanto en queries Prisma (`whereReclamosByRol`) como en las API routes de archivos.
- **Verificación doble en archivos binarios**: la API route de archivos verifica primero el rol genérico (`puedeVerDocumentos`) y luego que el `prestadoraId` del documento coincida con el del usuario si el rol es `OPERADOR_PRESTADORA`.

### Validación de inputs
- **Zod en todas las Server Actions**: cada action parsea y valida el FormData con un schema Zod antes de operar. Los datos que no pasan la validación lanzan un error inmediatamente.
- **Tipos de archivo permitidos**: `lib/uploads.ts` valida el MIME type de cada archivo subido y rechaza los no permitidos.
- **Límites de tamaño**: todos los handlers de upload tienen un techo explícito de bytes.

### CSRF
- **Protegido por NextAuth**: las Server Actions de Next.js están protegidas por el mismo mecanismo de origen que el framework. NextAuth agrega una capa adicional de validación para sus propias rutas.

### Workflow de documentos
- Las transiciones de estado (`EstadoDocumento`, `ReclamoEstado`) son validadas contra las transiciones permitidas antes de aplicarse, evitando saltos de estado no autorizados.

---

## Lo que falta o debería revisarse

### Rate limiting en login
No hay limitación de intentos de login. Un atacante puede hacer fuerza bruta contra el endpoint `/api/auth/callback/credentials` sin restricción. **Riesgo: medio-alto** en un sistema con datos de ciudadanos.

Recomendación: agregar un middleware de rate limiting (por IP) en `/api/auth/callback/credentials`. Opciones: `@upstash/ratelimit` con Redis (gratis en Upstash), o un middleware simple con un Map en memoria (no escala en múltiples instancias de Vercel, pero es mejor que nada).

### Expiración del token de reset de password
El modelo `Usuario` tiene los campos `passwordResetToken` y `passwordResetExpires`. Es necesario verificar que en el handler de `/restablecer-clave` se valide que `passwordResetExpires > new Date()` antes de aceptar el reset. Si esto no está verificado, un token robado podría usarse indefinidamente.

### Content-Security-Policy (CSP)
`next.config.ts` no define headers de seguridad. En producción debería agregarse al menos:
- `Content-Security-Policy`: restringir orígenes de scripts, estilos e iframes.
- `X-Frame-Options: DENY` o `SAMEORIGIN`.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.

Ejemplo de configuración en `next.config.ts`:
```ts
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ],
  },
],
```

### HTTPS forzado
En Vercel, HTTPS es automático. Si se migra a un VPS propio, asegurarse de configurar redirección HTTP → HTTPS en el proxy (nginx, caddy) y agregar `HSTS` headers.

### Auditoría de acciones sensibles
Las acciones sobre reclamos tienen log en `ReclamoEvento`. Sin embargo, no hay log equivalente para:
- Creación/modificación de usuarios.
- Cambios de estado en expedientes y documentos (salvo el campo `revisadoEn`/`revisorId`).
- Exportación de informes.

Para un sistema regulatorio, se recomienda una tabla de auditoría genérica que registre `(usuarioId, accion, entidad, entidadId, timestamp, ip)`.

### Secreto de producción
`AUTH_SECRET` debe ser un valor aleatorio largo (mínimo 32 bytes de entropía). Generarlo con:
```bash
npx auth secret
# o: openssl rand -base64 32
```
Verificar que el valor en Vercel no sea el placeholder del `.env.example`.

### Datos personales (DNPD)
El sistema almacena DNI, nombre, apellido, email y teléfono de ciudadanos. Considerar política de retención: ¿por cuánto tiempo se conservan los datos de ciudadanos cuyos reclamos están cerrados? No hay mecanismo de anonimización o borrado actualmente.
