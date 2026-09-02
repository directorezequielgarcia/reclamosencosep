# Snapshot de respaldo — mapa de transporte de la Municipalidad

Estos archivos son una copia de seguridad del dataset que publica la
Municipalidad de Comodoro Rivadavia para su propio mapa interactivo
(https://comodoro-mit.github.io/transporte), usado por `ZorritoGuia.tsx`
y `MiniMapaLinea.tsx`. Las URLs y códigos de archivo que usa el código
viven en `lib/transporte-mcr.ts`.

## Por qué existen

El código SIEMPRE intenta traer los datos en vivo desde el sitio de la
Municipalidad primero (fetch client-side, CORS abierto). Este snapshot
es solo un **fallback automático** para cuando ese sitio no responde.

## Migración del 01/09/2026 (Resolución 1.628/26)

La Municipalidad reestructuró su dataset junto con la entrada en
vigencia de la Resolución 1.628/26: antes publicaba
`layers_transporte/<archivo>_data.js` (JSON envuelto en `var x = ...;`,
23 archivos con códigos como `6A`/`6B`/`8H`/`8AH`), ahora publica
`data/<archivo>.geojson` y `data/paradas.json` en JSON plano, con 24
archivos de línea (agregó `9a`, y renombró los sentidos de las
circulares 6 y 8 a `6h`/`6ah`/`8h`/`8ah` = horario/antihorario). El
snapshot viejo (que a su vez ya era un respaldo de la Resolución
1.399/26 anterior, bajado el 24/08/2026) quedó doblemente
desactualizado y con URLs que ya no existen (404) — el 02/09/2026 se
detectó que por eso la guía SIEMPRE caía al fallback y mostraba el
cartel de "mapa en mantenimiento" aunque el sitio oficial ya estaba
arriba con los datos nuevos.

## De dónde salió este snapshot

- Repo fuente: https://github.com/comodoro-mit/transporte, carpeta `data/`
- Descargado el 02/09/2026 directo desde
  `https://comodoro-mit.github.io/transporte/data/` (paradas.json +
  los 24 `linea-<codigo>.geojson` vigentes), ya con los recorridos de
  la Resolución 1.628/26.

## Cuándo actualizarlo

Este snapshot solo se usa si el sitio en vivo no responde. Si en el
futuro la Municipalidad vuelve a reestructurar el dataset (nuevos
nombres de archivo, otro formato), el fetch en vivo va a empezar a
fallar de nuevo y el código va a caer a esta copia desactualizada sin
avisar que cambió la estructura — conviene revisar de tanto en tanto
que `linea-1.geojson` (por ejemplo) siga respondiendo 200 en la URL
de `lib/transporte-mcr.ts`, y si no, repetir esta descarga.
