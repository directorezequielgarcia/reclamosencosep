import { PrismaClient } from "@prisma/client";
import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";

const p = new PrismaClient();

const autor =
  (await p.usuario.findUnique({ where: { dni: "27345678" } })) ??
  (await p.usuario.findFirst({ where: { rol: "DIRECTOR" } })) ??
  (await p.usuario.findFirst({ where: { rol: "GESTOR_ENTE" } }));
if (!autor) {
  console.error("No hay autor disponible (director / gestor).");
  process.exit(1);
}

const prestadora = await p.prestadora.findFirst({
  where: { razonSocial: { contains: "SCPL" } },
});
if (!prestadora) {
  console.error("No se encontró la prestadora SCPL.");
  process.exit(1);
}

const id = "auditoria-scpl-1979-m-2024";

// Sin BLOB_READ_WRITE_TOKEN disponible localmente: se copian a public/uploads
// (mismo fallback que guardarArchivoAuditoria en lib/uploads.ts).
const destDir = path.join(process.cwd(), "public", "uploads", "auditorias", id);
await mkdir(destDir, { recursive: true });

const docs = [
  {
    titulo: "Análisis de Razonabilidad (informe técnico)",
    origen:
      "C:/Users/gje_9/Claude/01_ENCOSEP/Auditoria SCPL/Analisis de Razonabilidad - Auditoria SCPL (Expte 1979-M-2024).docx",
    nombreArchivo: "analisis-razonabilidad-auditoria-scpl-1979-2024.docx",
  },
  {
    titulo: "Explicación y Puntos de Atención (lectura en criollo)",
    origen:
      "C:/Users/gje_9/Claude/01_ENCOSEP/Auditoria SCPL/Explicacion y Puntos de Atencion - Auditoria SCPL.docx",
    nombreArchivo: "explicacion-y-puntos-de-atencion-auditoria-scpl.docx",
  },
];

const mimeWord =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

for (const doc of docs) {
  await copyFile(doc.origen, path.join(destDir, doc.nombreArchivo));
  doc.url = `/uploads/auditorias/${id}/${doc.nombreArchivo}`;
  console.log("Documento copiado a:", doc.url);
}

const titulo = "Auditoría Económico-Financiera SCPL";

const resumen =
  "Lectura completa del Expte. Municipal N° 1979-M-2024: qué auditó la Secretaría de Economía municipal a la SCPL entre 2021 y 2024, qué encontró, y qué distancia hay entre la evidencia relevada y las conclusiones del informe.";

const queEsAuditoria = `Una auditoría es un examen independiente sobre si una organización cumplió determinadas normas, registró correctamente sus operaciones o gestionó bien sus recursos. No es lo mismo "auditar" que "opinar si algo está bien o mal en general": según el tipo de auditoría, el trabajo puede limitarse a verificar puntos específicos contra reglas específicas, sin llegar a un veredicto global.

Esta auditoría a la SCPL fue una "auditoría de cumplimiento", bajo las Normas de Control de Cumplimiento Gubernamental de la Auditoría General de la Nación (AGN), basadas en el estándar internacional ISSAI 4100. Eso significa que revisó si determinados hechos (facturación, pagos, transferencias) se ajustaron a determinadas normas, pero el propio informe aclara expresamente que no da una opinión de razonabilidad ni un veredicto general de cumplimiento sobre la cooperativa.`;

const alcance = `La auditoría cubrió el período 01/01/2021 al 31/12/2024 (48 meses) y se organizó en tres bloques:

Bloque A — Facturación a usuarios: conceptos facturados vs. cuadros tarifarios, ítems 413/473 (aportes capitalizables), impuestos provinciales, Fondo de Ayuda a Bomberos Voluntarios, y usuarios electrodependientes (Ley 27.351).

Bloque B — Relación con CAMMESA (mercado eléctrico mayorista): cesión en garantía de cuentas recaudadoras, cumplimiento de pagos, saldo de deuda, distribución de facturación por servicio y consistencia entre energía comprada y vendida.

Bloque C — Seguimiento de 21 recomendaciones de dos auditorías anteriores: la de la UNPSJB (2012) y la del Tribunal de Cuentas Municipal (2018).

Quedaron expresamente FUERA del alcance, sin ningún procedimiento ejecutado: las multas e intereses aplicados a los usuarios (A.2), y el contrato de concesión de agua con la Provincia del Chubut (B.2). El propio informe reconoce no haber podido reunir elementos de juicio suficientes sobre esas dos materias.`;

const procedimientos = `Sobre la facturación a usuarios se aplicó un muestreo estadístico sobre un universo de 8.223.479 cuentas-factura (47 meses, feb/2021 a dic/2024): una muestra base de 384 casos (nivel de confianza 95%, error 5%) más refuerzos dirigidos, hasta 730 comprobantes diseñados, de los cuales se verificaron efectivamente 628 (251 de Energía, 205 de Agua Estimada, 172 de Cloacas). Agua Medida y Agua Tratada —juntas, menos del 2% del universo— quedaron sin verificación tarifaria efectiva, algo que el informe reconoce en vez de omitir.

Para usuarios electrodependientes se usó una muestra dirigida (no probabilística) de 30 cuentas por 13 períodos.

Sobre CAMMESA el trabajo fue más profundo: conciliación de mayores contables, cruce de 86 Órdenes de Pago, trazado de 18 cadenas de reemplazo de cheques, lectura íntegra de 5 acuerdos y actas, y 17 pruebas sustantivas documentadas.

Sobre el Bloque C se leyeron los dos informes originales (2012 y 2018) y las notas de respuesta de SCPL, clasificando cada recomendación en cuatro estados posibles: cumplida, en proceso, no implementada, o sin datos suficientes.`;

const hallazgos = `Facturación a usuarios: 89 desvíos sobre 628 comprobantes verificados (la mayoría por categorización incorrecta o por usar la versión de cuadro tarifario que no correspondía en un mes puntual). Una diferencia de aproximadamente $810 millones entre lo facturado a los usuarios por el Fondo de Ayuda a Bomberos Voluntarios y lo efectivamente transferido, sin causa identificada. 37 de los 48 meses auditados sin transferencia formal de un impuesto provincial a EPRESP. Una brecha entre el padrón de usuarios electrodependientes (108) y la documentación de compra de generadores (solo 20 documentados sobre 48 usuarios marcados), aunque el propio informe relativiza esa brecha porque faltan facturas de 13 de los 48 meses.

CAMMESA: un pago equivalente al 67% de todo lo abonado en el período se hizo con un único cheque diferido a 11 meses. Coexisten tres acuerdos de regularización de deuda vigentes al mismo tiempo. Una adenda de junio de 2025 formaliza la cesión de hasta el 50% de la recaudación de 5 cuentas bancarias durante 115 meses (casi diez años) en garantía de esa deuda.

Recomendaciones previas (Bloque C): de 21 recomendaciones de 2012 y 2018, solo 1 está totalmente cumplida. 16 siguen "en proceso" —algunas desde hace 14 años—, 2 nunca se implementaron (entre ellas, un sistema de costos integral y un plan estratégico formal), y sobre 2 no hay información suficiente para evaluarlas.`;

const conclusiones = `El informe no formula una opinión global de cumplimiento ni de razonabilidad: es, por diseño metodológico (ISSAI 4100, "informe directo"), una compilación de hallazgos puntuales por materia, no un veredicto único sobre la gestión de SCPL. Cita textual del propio informe: "no expresa una opinión de razonabilidad ni una opinión global de cumplimiento sobre el ente auditado [...] no provee, ni se ha diseñado para proveer, una conclusión que otorgue seguridad razonable ni seguridad limitada."

El expediente se cerró formalmente por Resolución Municipal N° 1257-26 (25/06/2026), previo Dictamen jurídico N° 339/2026 de Asesoría Letrada. Ambos actos son expresos en aclarar que el cierre del expediente NO implica aprobación, convalidación ni pronunciamiento sobre el contenido técnico de los hallazgos. Las actuaciones se remitieron al Intendente para "eventuales medidas administrativas, regulatorias, contractuales o judiciales", sin fijar plazo, responsable ni mecanismo de seguimiento.`;

const razonabilidad = `Del análisis surgen diez puntos donde la clasificación, la severidad o la redacción del propio informe no siempre se corresponde de manera directa con la evidencia que él mismo cita:

Los más relevantes: el Bloque B (CAMMESA) tiene un sistema completo de códigos y niveles de gravedad asignados a cada hallazgo; el Bloque A (facturación a usuarios) no clasifica ningún hallazgo con severidad, pese a incluir datos de materialidad comparable o mayor (los $810 millones sin explicar del Fondo de Bomberos, los 37 meses sin transferencia a EPRESP). Un mismo hallazgo —la cesión de cuentas a CAMMESA— aparece numerado de dos formas distintas en dos secciones del propio informe (H-CAM-04 y H-CAM-07). En al menos tres recomendaciones del Bloque C, el "estado" formal asignado no coincide con lo que dice el propio comentario narrativo del auditor sobre esa misma recomendación. Hay un error aritmético sin aclarar en el cálculo de pérdidas de energía de la matriz consolidada.

A favor de la razonabilidad del informe: el diseño muestral de facturación es transparente en sus exclusiones (reconoce expresamente qué estratos no pudo verificar, en vez de omitirlo). El bloque CAMMESA es el más riguroso, con evidencia documental trazable y severidad proporcionada a la magnitud de cada hallazgo. Y hay al menos dos casos de análisis crítico genuino, donde el auditor no toma una cifra favorable al pie de la letra sino que indaga qué hay detrás de ella.`;

const recomendaciones = `Completar el examen de las dos materias que quedaron totalmente fuera del alcance —multas e intereses a usuarios, y el contrato de concesión de agua con la Provincia del Chubut— dado que ambas inciden directamente sobre el usuario.

Unificar el criterio de clasificación de severidad entre bloques, para que el Bloque A (facturación a usuarios) tenga el mismo nivel de detalle y gravedad asignada que el Bloque B (CAMMESA).

Corregir la numeración inconsistente de hallazgos entre secciones del mismo informe, para no comprometer la trazabilidad del seguimiento futuro.

Fijar un cronograma concreto, con responsable y plazo, para las 16 recomendaciones que siguen "en proceso" —muchas desde hace más de una década—, en vez de dejarlas abiertas sin fecha como ocurrió con el cierre de este expediente.

Aclarar públicamente, cada vez que se comunique este informe, que dos materias con incidencia directa en el usuario no fueron examinadas, para no dar la impresión de que "pasaron el control".`;

const opinionEncosep = `El propio informe reconoce que ENCOSEP conserva la facultad de auditoría permanente sobre los servicios concesionados. El cierre administrativo municipal es expresamente formal —no convalida el contenido técnico— y eso le deja margen de acción propio al Ente.

Desde ENCOSEP correspondería: pedir aclaración formal de las inconsistencias de mayor gravedad detectadas en este análisis (la asimetría de tratamiento entre bloques, y la numeración cambiante del hallazgo de cesión a CAMMESA); requerir que se complete el examen de las dos materias excluidas (multas/intereses a usuarios y el contrato con la Provincia del Chubut); y dar seguimiento propio, con plazos concretos, a las 16 recomendaciones que siguen "en proceso" desde hace años. La cesión de hasta el 50% de la recaudación de SCPL por 115 meses es, además, el dato de mayor magnitud institucional del expediente y amerita un seguimiento específico, porque es un compromiso que puede terminar impactando en la tarifa que paga el usuario.`;

const auditoria = await p.auditoria.upsert({
  where: { id },
  update: {
    titulo,
    prestadoraId: prestadora.id,
    archivoUrl: null, // los documentos ahora viven en AuditoriaDocumento (ver más abajo)
    expediente: "Expte. Municipal N° 1979-M-2024",
    auditorResponsable:
      "Secretaría de Economía, Finanzas y Control de Gestión — Municipalidad de Comodoro Rivadavia (Cdor. Fernando A. Barría)",
    tipoAuditoria:
      "Auditoría de Cumplimiento — Normas de Control de Cumplimiento Gubernamental de la AGN, basadas en ISSAI 4100 (informe directo)",
    periodoAuditado: "01/01/2021 – 31/12/2024",
    fechaInforme: new Date("2026-05-01T00:00:00-03:00"),
    resumen,
    queEsAuditoria,
    alcance,
    procedimientos,
    hallazgos,
    conclusiones,
    razonabilidad,
    recomendaciones,
    opinionEncosep,
  },
  create: {
    id,
    titulo,
    prestadoraId: prestadora.id,
    expediente: "Expte. Municipal N° 1979-M-2024",
    auditorResponsable:
      "Secretaría de Economía, Finanzas y Control de Gestión — Municipalidad de Comodoro Rivadavia (Cdor. Fernando A. Barría)",
    tipoAuditoria:
      "Auditoría de Cumplimiento — Normas de Control de Cumplimiento Gubernamental de la AGN, basadas en ISSAI 4100 (informe directo)",
    periodoAuditado: "01/01/2021 – 31/12/2024",
    fechaInforme: new Date("2026-05-01T00:00:00-03:00"),
    resumen,
    queEsAuditoria,
    alcance,
    procedimientos,
    hallazgos,
    conclusiones,
    razonabilidad,
    recomendaciones,
    opinionEncosep,
    publicado: false,
    autorId: autor.id,
  },
});

// Idempotente: si el script se vuelve a correr, no duplicar documentos.
await p.auditoriaDocumento.deleteMany({ where: { auditoriaId: auditoria.id } });
for (const doc of docs) {
  await p.auditoriaDocumento.create({
    data: {
      auditoriaId: auditoria.id,
      titulo: doc.titulo,
      url: doc.url,
      mimeType: mimeWord,
    },
  });
}

console.log("Auditoría cargada (borrador, sin publicar):");
console.log(`  ID: ${auditoria.id}`);
console.log(`  ${auditoria.titulo}`);
console.log(`  Prestadora: ${prestadora.razonSocial}`);
console.log(`  Documentos: ${docs.map((d) => d.titulo).join(" | ")}`);
console.log(`  publicado: ${auditoria.publicado}`);

await p.$disconnect();
