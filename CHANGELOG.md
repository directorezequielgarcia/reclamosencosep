# Registro de versiones — ResPública

> Plataforma de gestión y control para la administración pública.
> Autoría: Dr. Cr. Ezequiel García (desarrollada con recursos propios).
> Este archivo, junto con el historial del repositorio (git), deja constancia
> datada de la evolución de la obra, como respaldo de los derechos de autor.
> La instancia desplegada para el ENCOSEP usa la identidad institucional del Ente.

## 2026-06-12 — Calculadora de tarifas (Calculadora ENCOSEP)

Módulo público de transparencia tarifaria y control de factura:

- **Motor de cálculo tarifario** (`lib/tarifas.ts`): factura por categoría de
  usuario (residencial, comercial, obrador, entidad sin fines, entes oficiales,
  pequeña industria), agua estimada (por m²) y medida (por m³), cloacas,
  alumbrado, subsidios e IVA; composición de factura.
- **Cuadros versionados**: anterior (ago-2025), vigente (feb-2026) y pedido
  (jun-2026), con comparación antes/ahora y proyección del aumento.
- **Gráfico de composición** de factura (SVG propio) e **instructivos**.
- **Control de factura** (`lib/factura-parse.ts`): el usuario sube el PDF o una
  foto (OCR en el navegador), se extraen consumo, m² y conceptos, se detecta el
  cuadro con que se facturó y se proyecta el mismo consumo en cada cuadro.
- **Panel de administración de cuadros** (`/admin/tarifas`): carga de cuadros y
  aumentos (copiar base + %), publicación y subida del PDF.
- Comprobante imprimible / PDF con el gráfico de composición.

## Historial previo

El desarrollo del Portal (expediente digital, reclamos y elevación,
inspecciones digitales, indicadores/KPI, mapa de calor, trazabilidad
normativa–sistema, gestión documental, audiencias, informes) consta en el
historial de commits del repositorio, con fecha y autoría.
