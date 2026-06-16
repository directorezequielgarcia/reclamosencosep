# 01 — Visión general del sistema

## Qué es

El **Portal de Reclamos ENCOSEP** es una aplicación web institucional del Ente de Control de Servicios Públicos de Comodoro Rivadavia (ENCOSEP), compuesta por dos superficies bien diferenciadas:

- **Portal ciudadano** (`/`): permite a los vecinos cargar reclamos sobre los servicios públicos de la ciudad (residuos, energía, agua, transporte), seguir el estado en tiempo real y calificar los servicios.
- **Panel administrativo** (`/admin`): usado por el equipo del ENCOSEP para gestionar reclamos, expedientes, inspecciones de campo, documentación de prestadoras, audiencias públicas, boletines, informes mensuales y anuales, cuadros tarifarios y usuarios del sistema.

## Quiénes lo usan

| Tipo de usuario | Descripción | Acceso |
|---|---|---|
| Vecinos | Ciudadanos de Comodoro Rivadavia | Portal público |
| Prestadoras | SCPL, Clear Urbana, Patagonia, Diadema | Panel admin (rol `OPERADOR_PRESTADORA`) |
| Equipo ENCOSEP | Directorio, Adriana, Yanina, Julieta, Marcos | Panel admin (roles funcionales) |
| Autoridades externas | PEM, Concejo Deliberante, Autoridad de Aplicación | Panel admin (roles de consulta) |

El sistema tiene 13 roles distintos. Ver `docs/04_auth_roles.md` para el detalle completo.

## URLs

| Entorno | URL |
|---|---|
| Producción | https://reclamosencosep.vercel.app |
| Local dev | http://localhost:3000 |

El deploy es continuo en Vercel: cada push a la rama principal dispara un nuevo build.

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| Runtime | Node.js (Vercel serverless) | — |
| Lenguaje | TypeScript | 5.x |
| Base de datos | PostgreSQL vía Prisma ORM | Prisma 6.x |
| Autenticación | NextAuth.js v5 (beta) | 5.0.0-beta.31 |
| UI | React 19 + Tailwind CSS 4 | — |
| Mapas | Leaflet + react-leaflet | — |
| Generación de documentos | docx (Word) | 9.x |
| Almacenamiento de archivos | Vercel Blob (opcional) o tabla `ArchivoBlob` en DB | — |
| Validación | Zod | 4.x |
| Hash de passwords | bcryptjs | 3.x |
| Emails | Nodemailer | 7.x |
| OCR / PDF | Tesseract.js + pdf-parse | — |

## Estado actual

El sistema está en producción desde 2025. Usa Neon (PostgreSQL serverless) en el plan gratuito. El objetivo de la migración documentada en `docs/08_deploy_migracion.md` es moverse a un PostgreSQL propio para evitar las limitaciones del free tier de Neon (conexiones simultáneas, compute hours, tamaño de DB).
