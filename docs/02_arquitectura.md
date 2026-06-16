# 02 — Arquitectura

## Next.js App Router

El proyecto usa el **App Router** de Next.js 16 con TypeScript estricto. Todos los archivos viven bajo `app/`. La distinción entre Server Components y Client Components es central:

- **Server Components** (default): renderizan en el servidor, pueden consultar la DB directamente vía Prisma, no envían JS al cliente. Son la mayoría de las páginas del admin.
- **Client Components** (marcados con `"use client"`): necesarios para interactividad (mapas Leaflet, formularios con estado local, grabación de audio en campo). Solo se usan donde no hay alternativa server-side.
- **Server Actions** (marcados con `"use server"`): funciones de mutación que se ejecutan en el servidor y se llaman desde el formulario del cliente sin necesidad de un endpoint dedicado. Son el patrón principal para todas las escrituras del panel admin.
- **API Routes** (`app/api/`): se usan exclusivamente para servir binarios (archivos PDF, imágenes, audio) donde una Server Action no es adecuada porque la respuesta debe ser un stream binario con headers específicos de MIME.

## Estructura de carpetas

```
reclamos-app/
├── app/
│   ├── (ciudadano)/          # Portal público del vecino (sin prefijo en URL)
│   ├── (sitio)/              # Páginas institucionales públicas
│   ├── admin/                # Panel administrativo (rutas protegidas)
│   │   ├── audiencias/
│   │   ├── bandeja/
│   │   ├── boletines/
│   │   ├── documentacion/
│   │   ├── expediente/
│   │   ├── expedientes/
│   │   ├── informes/
│   │   ├── inspecciones/
│   │   ├── reclamo/
│   │   ├── tarifas/
│   │   ├── usuarios/
│   │   ├── vencimientos/
│   │   ├── layout.tsx        # Layout común del panel admin (verifica sesión)
│   │   └── page.tsx          # Dashboard del admin
│   ├── api/
│   │   ├── auth/[...nextauth]/  # Handler de NextAuth
│   │   ├── documentos/[id]/archivo/  # Sirve PDF de documento
│   │   ├── documentos/[id]/nota/     # Sirve .docx de nota técnica generada
│   │   ├── informes/                 # Endpoints de informes
│   │   ├── inspecciones/             # Endpoints de inspecciones
│   │   └── reclamos/                 # Endpoints de reclamos (adjuntos)
│   ├── acceso/               # Página de ingreso al sistema
│   ├── capacitacion/
│   ├── crear-cuenta/
│   ├── ingresar/
│   ├── institucional/
│   ├── mi-cuenta/
│   ├── notas/
│   ├── olvide-clave/
│   └── restablecer-clave/
├── components/               # Componentes React reutilizables
├── lib/                      # Lógica de negocio, helpers, clientes
│   ├── admin.ts              # Roles, permisos y helpers de autorización
│   ├── auth.ts               # Configuración NextAuth
│   ├── prisma.ts             # Singleton del cliente Prisma
│   ├── uploads.ts            # Lógica de almacenamiento de archivos
│   ├── documentos.ts         # Workflow de estados de documentos
│   ├── docx-*.ts             # Generadores de documentos Word
│   ├── email.ts              # Envío de emails con Nodemailer
│   └── tarifas.ts            # Lógica de la calculadora tarifaria
├── prisma/
│   ├── schema.prisma         # Modelo de datos completo
│   └── seed.ts               # Script de datos iniciales
├── public/
│   └── uploads/              # Archivos subidos en dev (sin Vercel Blob)
├── scripts/                  # Scripts de mantenimiento
├── types/                    # Tipos TypeScript adicionales
├── next.config.ts
└── package.json
```

## Flujo de autenticación (NextAuth JWT)

1. El usuario accede a `/ingresar` y envía DNI + password.
2. NextAuth llama al provider `Credentials` definido en `lib/auth.ts`.
3. El provider valida el DNI contra la tabla `Usuario` y compara la password con bcryptjs.
4. Si es válido, emite un JWT que incluye: `id`, `dni`, `rol`, `prestadoraId`.
5. El JWT se almacena en una cookie HttpOnly gestionada por NextAuth.
6. En cada request, `auth()` (de `lib/auth.ts`) decodifica el JWT y devuelve la session.
7. El layout de `/admin` (`app/admin/layout.tsx`) llama a `auth()` y redirige a `/ingresar` si no hay sesión.

No hay sesiones en DB: toda la información de sesión viaja en el JWT (estrategia `"jwt"`).

## Patrones principales

**Mutaciones — Server Actions**

Cada módulo tiene un archivo `actions.ts` con `"use server"` al tope. Ejemplo: `app/admin/documentacion/actions.ts`. El patrón es siempre:
1. Obtener la sesión con `auth()` y verificar el rol.
2. Parsear y validar el input con Zod.
3. Ejecutar la mutación en Prisma.
4. Llamar a `revalidatePath()` para invalidar el cache de la página afectada.
5. Opcionalmente hacer `redirect()`.

**Lectura de binarios — API Routes**

Las API routes de `app/api/documentos/[id]/archivo/route.ts` y similares verifican la sesión y el rol antes de servir el binario. Devuelven un `NextResponse` con el `Content-Type` correcto (ver `docs/05_almacenamiento_archivos.md`).

**Generación de documentos Word**

Los archivos `lib/docx-*.ts` usan la librería `docx` para generar `.docx` en memoria (Buffer). El archivo se sube a Vercel Blob o a la DB y su URL se guarda en el registro correspondiente.

## Limitaciones actuales de Vercel Hobby

| Limitación | Valor | Impacto |
|---|---|---|
| Timeout de funciones | 10 segundos | Operaciones largas (generación de informes, OCR de PDFs) pueden fallar |
| Tamaño máximo del body (Server Action) | 4 MB configurado en `next.config.ts` | Archivos PDF grandes no pueden subirse |
| Filesystem persistente | No disponible | Los archivos subidos en dev a `public/uploads/` no persisten en Vercel; se necesita Vercel Blob o DB |
| Conexiones DB simultáneas | Limitado por Neon free tier | Con carga real puede haber errores de "too many connections" |
