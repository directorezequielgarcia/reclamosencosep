import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const autor =
  (await p.usuario.findUnique({ where: { dni: "27345678" } })) ??
  (await p.usuario.findFirst({ where: { rol: "GESTOR_ENTE" } }));
if (!autor) {
  console.error("No hay autor disponible (super admin / gestor).");
  process.exit(1);
}

const clippings = [
  {
    id: "clipping-cronica-2026-08-05-desorientacion-recorridos",
    titulo:
      'Diario Crónica: "Existe desorientación en los recorridos y frecuencias de la nueva empresa"',
    resumen:
      "El presidente del ENCOSEP, Cristian Serdeiro, hizo un balance de la transición del transporte tras el arranque de SolBus: más de 300 consultas recibidas sobre rutas y frecuencias. El organismo montó una plataforma con geolocalización y el equipo técnico realiza inspecciones presenciales para verificar las denuncias.",
    fuente: "Diario Crónica",
    enlaceExterno:
      "https://www.diariocronica.com.ar/noticias/2026/08/05/158776-existe-desorientacion-en-los-recorridos-y-frecuencias-de-la-nueva-empresa",
    fechaPublicacion: new Date("2026-08-05T12:00:00-03:00"),
    servicio: "TRANSPORTE",
  },
  {
    id: "clipping-cronica-2026-08-04-solbus-reclamos",
    titulo: 'Diario Crónica: "Masivo reclamo por el servicio que ofrece SolBus"',
    resumen:
      "ENCOSEP presentó su nuevo sitio web con herramientas de inteligencia artificial. La nota cita al vicepresidente Ezequiel García, al presidente Cristian Serdeiro y al vocal Maximiliano López: el 96% de las presentaciones recibidas (100 en total) corresponde al servicio de colectivos, por ausencia de unidades y frecuencias irregulares.",
    fuente: "Diario Crónica",
    enlaceExterno:
      "https://www.diariocronica.com.ar/noticias/2026/08/04/158659-masivo-reclamo-por-el-servicio-que-ofrece-solbus",
    fechaPublicacion: new Date("2026-08-04T12:00:00-03:00"),
    servicio: "TRANSPORTE",
  },
  {
    id: "clipping-adnsur-2026-08-04-340-reclamos-solbus",
    titulo:
      'ADNSUR: "EnCoSeP recibió más de 340 reclamos en los primeros días de SolBus en Comodoro y anunció cambios"',
    resumen:
      "El presidente del ENCOSEP, Cristian Serdeiro, confirmó más de 340 presentaciones sobre el nuevo sistema SolBus: demoras, cambios de recorrido y distancia a las nuevas paradas. Se difundió la plataforma de reclamos reclamosencosep.vercel.app como canal oficial.",
    fuente: "ADNSUR",
    enlaceExterno:
      "https://www.adnsur.com.ar/sociedad/encosep-recibio-mas-de-340-reclamos-en-los-primeros-dias-de-solbus-en-comodoro-y-anuncio-cambios_a6a71f1a29302a4ae5a5c175a",
    fechaPublicacion: new Date("2026-08-04T11:39:00-03:00"),
    servicio: "TRANSPORTE",
  },
  {
    id: "clipping-comodorense-2026-08-05-poder-contralor",
    titulo:
      'El Comodorense: "Desde el ENCOSEP aseguran que ejercerán su poder de contralor en el servicio de transporte público"',
    resumen:
      "Cristian Serdeiro afirmó que el ENCOSEP fiscalizará el nuevo sistema SolBus: labraron más de seis actas sobre el estado de las paradas y desarrollaron una herramienta digital de reclamos. De cerca de 300 reclamos recibidos, unos 70 resultaron objetivos tras la verificación técnica.",
    fuente: "El Comodorense",
    enlaceExterno:
      "https://www.elcomodorense.net/desde-el-encosep-aseguran-que-ejerceran-su-poder-de-contralor-en-el-servicio-de-transporte-publico",
    fechaPublicacion: new Date("2026-08-05T12:59:00-03:00"),
    servicio: "TRANSPORTE",
  },
  {
    id: "clipping-cronica-2026-07-16-dictamen-luz",
    titulo:
      'Diario Crónica: "El aumento de la luz recibió dictamen favorable: el impacto sería de entre 1,6% y 5,9%"',
    resumen:
      "El ENCOSEP emitió dictamen favorable por mayoría (2 votos a favor, 1 en contra) sobre la readecuación tarifaria de la SCPL. Serdeiro destacó el impacto real en las boletas; el vicepresidente Ezequiel García votó en contra, cuestionando la diferencia entre los costos estructurales informados y el impacto real en la factura.",
    fuente: "Diario Crónica",
    enlaceExterno:
      "https://www.diariocronica.com.ar/noticias/2026/07/16/155065-el-aumento-de-la-luz-recibio-dictamen-favorable-el-impacto-seria-de-entre-1_6por_ciento-y-5_9por_ciento",
    fechaPublicacion: new Date("2026-07-16T12:00:00-03:00"),
    servicio: "ENERGIA",
  },
  {
    id: "clipping-adnsur-2026-07-16-readecuacion-tarifaria",
    titulo:
      'ADNSUR: "EnCoSeP aprobó por mayoría la readecuación tarifaria: aumentos de entre 1,6% y 5,9% en las boletas"',
    resumen:
      "Mismo dictamen tarifario de la SCPL: 2 votos a favor y 1 en contra. El ENCOSEP anunció que exigirá mayor transparencia (simulaciones por factura) en los próximos pedidos de aumento.",
    fuente: "ADNSUR",
    enlaceExterno:
      "https://www.adnsur.com.ar/sociedad/encosep-aprobo-por-mayoria-la-readecuacion-tarifaria--aumentos-de-entre-1-6--y-5-9--en-las-boletas_a6a58fd5b54487cf0d9e417ba",
    fechaPublicacion: new Date("2026-07-16T14:11:00-03:00"),
    servicio: "ENERGIA",
  },
  {
    id: "clipping-cronica-2026-07-06-audiencia-tarifas",
    titulo:
      'Diario Crónica: "Audiencia pública por tarifas: la SCPL respaldó el pedido de aumento"',
    resumen:
      "El presidente del ENCOSEP, Cristian Serdeiro, destacó la masiva participación ciudadana en la audiencia pública por tarifas. El organismo evaluará las presentaciones antes de emitir el informe final con el análisis de impacto social.",
    fuente: "Diario Crónica",
    enlaceExterno:
      "https://www.diariocronica.com.ar/noticias/2026/07/06/153349-audiencia-publica-por-tarifas-la-scpl-respaldo-el-pedido-de-aumento",
    fechaPublicacion: new Date("2026-07-06T12:00:00-03:00"),
    servicio: "ENERGIA",
  },
  {
    id: "clipping-consellopatagonico-2026-06-29-convocatoria-audiencia",
    titulo:
      'Consello Patagónico: "EnCoSeP convoca a una nueva audiencia pública como modalidad híbrida por un nuevo incremento solicitado por la SCPL"',
    resumen:
      "Serdeiro anunció la audiencia pública del 6 de julio por el pedido tarifario de la SCPL, con la incorporación de la modalidad híbrida (presencial y virtual). El expediente técnico-jurídico ya estaba cerrado al momento de la convocatoria.",
    fuente: "Consello Patagónico",
    enlaceExterno:
      "https://consellopatagonico.com/encosep-convoca-a-una-nueva-audiencia-publica-como-modalidad-hibrida-por-un-nuevo-incremento-solicitado-por-la-scpl/",
    fechaPublicacion: new Date("2026-06-29T12:00:00-03:00"),
    servicio: "ENERGIA",
  },
];

for (const c of clippings) {
  const boletin = await p.boletin.upsert({
    where: { id: c.id },
    update: {
      tipo: "CLIPPING",
      titulo: c.titulo,
      resumen: c.resumen,
      fuente: c.fuente,
      enlaceExterno: c.enlaceExterno,
      fechaPublicacion: c.fechaPublicacion,
      servicio: c.servicio,
      publicado: true,
    },
    create: {
      id: c.id,
      tipo: "CLIPPING",
      titulo: c.titulo,
      resumen: c.resumen,
      fuente: c.fuente,
      enlaceExterno: c.enlaceExterno,
      fechaPublicacion: c.fechaPublicacion,
      servicio: c.servicio,
      publicado: true,
      autorId: autor.id,
    },
  });
  console.log(`OK  ${boletin.fechaPublicacion.toISOString().slice(0, 10)}  ${boletin.fuente}: ${boletin.titulo}`);
}

await p.$disconnect();
