# Snapshot de respaldo — mapa de transporte de la Municipalidad

Estos archivos son una copia de seguridad del dataset que publica la
Municipalidad de Comodoro Rivadavia para su propio mapa interactivo
(https://comodoro-mit.github.io/transporte), usado por `ZorritoGuia.tsx`
y `MiniMapaLinea.tsx`.

## Por qué existen

El código SIEMPRE intenta traer los datos en vivo desde el sitio de la
Municipalidad primero (fetch client-side, CORS abierto). Este snapshot
es solo un **fallback automático** para cuando ese sitio no responde —
como pasó el 12/08/2026, cuando la Municipalidad sacó estos archivos de
su sitio publicado mientras actualizaba el mapa a la Resolución
1.628/26 (el HTML del sitio decía explícitamente: "Datos de recorridos
y paradas: excluidos del sitio publicado por el modo mantenimiento").

## De dónde salió

- Repo fuente: https://github.com/comodoro-mit/transporte
- Commit: `5b7e7702ed1e70c7d0304d3715d20cb92d29e44e` (04/08/2026, "Optimizar
  correcciones de precisión") — el último commit con estos archivos
  presentes, justo antes del commit `23ee5d94` (12/08/2026, "chore:
  remove leftover files") que los borró del repo.
- Descargado el 24/08/2026 vía `raw.githubusercontent.com` en ese commit
  puntual.

## ⚠️ Importante: está desactualizado a propósito

Este snapshot refleja las líneas de la **Resolución 1.399/26** (la
vigente hasta el 31/08/2026), NO la Resolución 1.628/26 (vigente desde
el 1° de septiembre de 2026, ver `app/(sitio)/areas-fiscalizadas/[svc]/page.tsx`).
Para las líneas que solo cambiaron de nombre o casi no cambiaron de
calles, el trazado sigue siendo útil de referencia. Para las que
cambiaron de identidad (ej. líneas 3 y 4, que pasaron de "Industrial –
Centro" a "Estadio Centenario – Abel Amaya"), este trazado va a
mostrar la ruta VIEJA — por eso el código avisa en pantalla
("⚠️ Mapa oficial en mantenimiento...") cada vez que termina usando este
snapshot en lugar del dato en vivo.

## Cuándo se puede borrar

Cuando la Municipalidad reactive su dataset en vivo con los recorridos
de la 1.628/26, este snapshot deja de hacer falta — el fetch en vivo
vuelve a tener prioridad automáticamente (no hace falta tocar código),
pero conviene igual reemplazar estos archivos por una copia nueva ya
actualizada, o borrar la carpeta entera si se prefiere volver a "sin
fallback" como estaba antes.
