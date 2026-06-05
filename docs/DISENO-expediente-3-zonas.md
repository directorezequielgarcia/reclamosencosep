# Diseño del Expediente — Vista de 3 zonas (Fase F)

> Diseño definido por el Director sobre boceto propio. Es la pantalla de trabajo
> del expediente administrativo dentro del panel del Ente.

## Layout general (3 columnas)

```
┌──────────────┬───────────────────────────┬──────────────────┐
│   ZONA I     │         ZONA II           │     ZONA III     │
│  CRÓNICA     │     MESA DE TRABAJO        │   MENSAJERÍA     │
│ (hoja de     │   (de la etapa elegida)   │                  │
│  ruta)       │                           │  Chat c/ usuario │
│              │                           │  Chat c/ prest.  │
└──────────────┴───────────────────────────┴──────────────────┘
```

## ZONA I — Crónica del expediente (hoja de ruta)
- Columna angosta a la izquierda.
- Lista **vertical y cronológica** de las etapas/actos del expediente:
  carátula → apertura → acta de recepción → … → resolución → archivo.
- Cada ítem indica la **foja** (número de orden del acto en el expediente).
- Es **clickeable**: al tocar una etapa, se abre en la Zona II.
- Marca cuál etapa está **activa** (seleccionada).

## ZONA II — Mesa de trabajo
- Columna central, la más ancha. Es donde se trabaja cada etapa.
- **Encabezado contextual:** arriba dice en qué etapa estás y una **explicación
  breve de qué hacer** (ej: "Estás en el Acta de recepción: dejá constancia de
  la pretensión, el reclamo y la documental aportada").
- Opcional: una **tira horizontal arriba** con las etapas (atajo además de la
  Zona I).
- Muestra el contenido del acto (título, cuerpo, adjuntos) y permite
  **editar/agregar** según el tipo de etapa.
- En **cada etapa** aparece el botón **Notificar** (ver concepto abajo).

## ZONA III — Mensajería
- Columna derecha.
- **Dos canales separados:**
  - **Chat con el usuario** (el vecino reclamante).
  - **Chat con la prestadora.**
- Mensajería de ida y vuelta con cada parte.

## Concepto clave: la NOTIFICACIÓN no es una etapa
- Notificar = **comunicar a las partes** (prestadora y/o usuario). No es un paso
  más de la hoja de ruta, es una **acción transversal** disponible en cada etapa.
- **Toda etapa puede notificarse.** Al notificar un acto:
  - Queda sellado "Notificado a [parte] · fecha".
  - **La parte notificada recién entonces ve el expediente** hasta ese acto
    (la prestadora/usuario ven solo lo notificado, no lo interno).
- Ejemplo de flujo:
  1. Abro el expediente → armo la **carátula**.
  2. Labro el **acta de recepción**.
  3. La **notifico** a la prestadora → desde ese momento la prestadora ve el
     expediente hasta ese acto.
  4. Sigo con los actos siguientes; cada uno lo notifico cuando corresponde.

## Plan de construcción (sub-fases)
- **F1 · Layout 3 zonas:** reorganizar la vista del expediente en las 3 columnas;
  Zona I clickeable + Zona II como mesa de trabajo con encabezado contextual por
  etapa. (Front; usa lo ya construido en A/B/C.)
- **F2 · Visibilidad por notificación:** la prestadora y el usuario ven solo los
  actos notificados a su parte. (Refina permisos de lectura.)
- **F3 · Mensajería (Zona III):** chat con usuario y chat con prestadora
  (modelo de mensajes + UI). (Lleva migración.)

## Mejoras pedidas (ronda 2)

1. **Notificación con alcance (la notif comunica, no es etapa).** En cada etapa,
   dos botones:
   - **Notificar solo esta etapa** → la parte ve **solo ese acto**.
   - **Notificar hasta acá** → la parte ve **el expediente completo hasta ese
     acto**.
   *(Estado: IMPLEMENTADO — G1.)*

2. **Carátula editable.** La carátula es la formalización del reclamo en
   expediente; en esa sección poder cargar/cambiar:
   - **Objeto** · **Prestadora** (viene la asociada, se puede cambiar) ·
     **Usuario/reclamante** (viene del reclamo, se puede cambiar). *(Pendiente — G2.)*

3. **Un reclamo → un solo expediente**, salvo apretar un botón que **dispare
   otro** expediente del mismo reclamo. *(Pendiente — G3.)*

4. **Estados automáticos del reclamo.** Al abrir = "Visto" (automático);
   "En revisión" manual al analizar; al **elevar a expediente** pasa automático a
   derivado/en proceso; el estado igual se puede cambiar a mano.
   *(Estado: IMPLEMENTADO al elevar — G4.)*

5. **Expediente aislado (sin reclamo previo).** Originado por la Autoridad de
   Aplicación, el Concejo u otro. Tipos: readecuación tarifaria, cambio de cuadro
   tarifario, etc. Campo **"solicitado por"**: Autoridad de Aplicación / Concejo
   Deliberante / Otro (especificar). *(Pendiente — G5.)*

## Modelo: el expediente como PROCESO ADMINISTRATIVO

El expediente es una **carpeta** que se abre cuando el reclamo se eleva a
carácter de expediente. Adentro viven **etapas (actos)** encadenadas, con idas
y vueltas — como un proceso administrativo real:

```
Apertura → Acta de recepción (pretensión + documental) → Notificación →
Constatación → Contestación prestadora → Disposición (proveído) →
[ Ampliación (el usuario pide/aporta) | otra Disposición |
  Derivación a Secretaría/Autoridad de Aplicación/otro Ente →
  Contestación de esa repartición | Prueba (pericia, no documental) ] (ciclos)
→ Resolución → Archivo
```

- **Disposición** = proveído simple (pueden dictarse varias).
- **Ampliación** = el usuario habla / pide / aporta.
- **Derivación** = se gira a una Secretaría / Autoridad de Aplicación / otro ente
  para su intervención; esa parte contesta. *(Falta tipo de acto DERIVACION +
  rol que contesta.)*
- **Prueba** = se puede sumar prueba no documental (p. ej. una pericia).

### Reglas de trabajo por rol (cada parte vuelca en SU etapa)
- Cada rol con **intervención en el expediente** (usuario, prestadora, ENCOSEP,
  Secretaría/Autoridad de Aplicación), al abrir su etapa, **puede generar /
  volcar / modificar** contenido en ella, según su rol.
- **ENCOSEP** puede **modificar la carátula** (G2).
- El **acta de recepción del reclamo NO va pegada a la carátula**: es un acto
  **separado**, y ahí se adjunta **toda la documental a la fecha**. *(YA está:
  CARATULACION y ACTA_RECEPCION son actos distintos.)*
- Se puede **incorporar más prueba documental en CUALQUIER etapa**. *(YA está:
  cada acto admite adjuntos foto/video/audio/documento.)*

### Estado vs. lo ya construido
- ✅ Etapas como actos encadenados · adjuntos en cada etapa · acta separada de
  la carátula · disposiciones múltiples · ampliación · contestación de la
  prestadora · resolución · notificación transversal.
- ⏳ **Derivación** a Secretaría/Autoridad de Aplicación + que esa repartición
  **conteste** (rol en el expediente).
- ⏳ **Permisos finos por rol/etapa** (quién vuelca en qué).
- ⏳ **G2** carátula editable por ENCOSEP.
