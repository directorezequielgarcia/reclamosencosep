import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } from "docx";
import { writeFileSync } from "node:fs";

const NAVY = "1d3550";
const NARANJA = "e88a3c";

function p(text, { bold = false, size = 22, color, align } = {}) {
  return new Paragraph({
    alignment: align,
    children: [new TextRun({ text, bold, size, color })],
    spacing: { after: 120 },
  });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 36, color: NAVY })],
    spacing: { before: 240, after: 180 },
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 28, color: NAVY })],
    spacing: { before: 240, after: 120 },
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 24, color: NARANJA })],
    spacing: { before: 180, after: 100 },
  });
}
function meta(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20 }),
      new TextRun({ text: value, size: 20 }),
    ],
    spacing: { after: 80 },
  });
}

const pendientes = [
  // PRIORIDAD ALTA - DATOS
  {
    cat: "Prioridad ALTA — Datos reales del equipo y prestadoras",
    items: [
      {
        n: "1. DNI reales del equipo del Ente",
        en_que_consiste:
          "Hoy los cuatro colaboradores institucionales —Adriana Almonacid (Control Documental), Marcos Barrionuevo (Comunicación y Medios), Yanina del Bono (Expedientes) y Julieta Palacios (Inspecciones)— están cargados con DNI temporales numerados del 11111111 al 44444444. Estos identificadores funcionan pero conviene reemplazarlos por los DNI reales de cada persona para que el login refleje fielmente la identidad institucional y se pueda usar el mismo número que figura en cualquier nota o expediente interno del Ente.",
        quien_aporta: "El Directorio, con los datos del legajo de cada uno.",
        esfuerzo: "5 minutos por persona (script de actualización).",
      },
      {
        n: "2. CUITs reales de las prestadoras",
        en_que_consiste:
          "De las cuatro prestadoras controladas, sólo SCPL tiene cargado un CUIT que se aproxima al real (30528775409). CLEAR URBANA, PATAGONIA Argentina S.R.L. y TRANSPORTE DIADEMA S.A. están cargadas con CUITs marcadores (30710000001, 002 y 003). Cuando se obtengan los CUITs verdaderos, se actualizan los registros de cada empresa y el identificador con el que cada operador hace login, sin perder permisos ni reclamos asignados.",
        quien_aporta: "Las propias prestadoras o la mesa de entradas del Ente.",
        esfuerzo: "15 minutos.",
      },
      {
        n: "3. Claves seguras definitivas",
        en_que_consiste:
          "Hoy todos los usuarios institucionales comparten una clave temporal: encosep-2026 para los colaboradores, scpl-2026 / clear-2026 / patagonia-2026 / diadema-2026 para las prestadoras y demo1234 para los demos. Estas claves son útiles para arrancar pero deben reemplazarse antes de pasar a producción real. La forma correcta es habilitar una pantalla Cambiar mi contraseña en el panel admin (ver punto 6) para que cada persona elija su propia clave.",
        quien_aporta: "Cada usuario se cambia su clave una vez habilitada la pantalla.",
        esfuerzo: "Incluido en el punto 6.",
      },
      {
        n: "4. Fotos y biografías de directores y colaboradores",
        en_que_consiste:
          "El sitio público muestra el Directorio (Cristian Serdeiro, Ezequiel García, Maximiliano López) y los cuatro responsables de área únicamente con su nombre. Para fortalecer la presencia institucional conviene contar con foto profesional de cada persona y una breve biografía o trayectoria de tres a cinco líneas. Estas fotos y textos se mostrarán en la sección Nosotros del sitio y eventualmente en una página de Equipo más extendida.",
        quien_aporta: "El área de Comunicación (Marcos) puede coordinar las fotos.",
        esfuerzo: "Una vez que estén las fotos, 30 minutos de carga.",
      },
    ],
  },
  // PRIORIDAD ALTA - FUNCIONALIDAD
  {
    cat: "Prioridad ALTA — Funcionalidad faltante",
    items: [
      {
        n: "5. Formulario admin para gestión de audiencias",
        en_que_consiste:
          "La audiencia del 27 de mayo (Exp.014-2026 SCPL) está cargada manualmente con un script. Para que el área de Comunicación pueda crear y editar audiencias por su cuenta hay que ampliar la interfaz de /admin/audiencias con: edición de cada audiencia ya creada, upload del PDF del expediente, upload del orden del día, marcar como REALIZADA cuando ocurra, upload del acta posterior y carga del texto del acta. Hoy la página /admin/audiencias permite crear pero no editar ni adjuntar archivos.",
        quien_aporta: "Marcos Barrionuevo principalmente.",
        esfuerzo: "Aproximadamente una hora.",
      },
      {
        n: "6. Pantalla Cambiar mi contraseña",
        en_que_consiste:
          "Hoy las claves se asignan al crear el usuario y no hay forma de cambiarlas desde la interfaz. Construir una pantalla simple en /admin/mi-cuenta donde cualquier usuario logueado pueda ingresar su clave actual y una nueva clave deseada. Esto resuelve el punto 3 (claves seguras) sin necesidad de intervención técnica externa.",
        quien_aporta: "Todos los usuarios.",
        esfuerzo: "Media hora.",
      },
      {
        n: "7. CMS del sitio institucional",
        en_que_consiste:
          "Hoy el contenido del sitio —directores, datos de contacto, textos de la misión, plan estratégico, etcétera— vive dentro del código. Para que el Directorio o el área de Comunicación pueda modificar esos textos y fotos sin pedir intervención técnica, hay que construir un panel /admin/configuracion-sitio donde se puedan editar campos clave. Incluye gestión de imágenes (subida vía Vercel Blob), edición de textos con formato simple, gestión de directores (orden, foto, biografía) y gestión de los datos de contacto del footer.",
        quien_aporta: "Directorio y Comunicación.",
        esfuerzo: "Tres horas aproximadamente.",
      },
      {
        n: "8. Notificaciones automáticas por email",
        en_que_consiste:
          "Cuando un reclamo cambia de estado o cuando una prestadora sube un documento, hoy nadie recibe aviso automático. Conviene integrar un servicio de envío de mail (Resend es la opción más simple y barata) para mandar: aviso al vecino cuando su reclamo es derivado, en proceso, resuelto o rechazado; aviso al operador prestadora cuando se le asigna un reclamo nuevo; aviso al Ente cuando una prestadora sube un documento; aviso al vecino con el código de inscripción cuando se anota a una audiencia. Cada mail incluye link directo a la página relevante.",
        quien_aporta: "Configuración técnica del lado del Portal.",
        esfuerzo: "Hora y media para el módulo más cinco minutos por cada tipo de notificación.",
      },
    ],
  },
  // PRIORIDAD MEDIA - VISIBLE
  {
    cat: "Prioridad MEDIA — Mejoras visibles",
    items: [
      {
        n: "9. Mapa de calor de Comodoro Rivadavia con los reclamos",
        en_que_consiste:
          "Una página pública (y también versión admin) con un mapa de la ciudad de Comodoro Rivadavia donde se vean todos los reclamos georeferenciados en un mapa de calor (heatmap). Las zonas con muchos reclamos se ven en rojo intenso, intermedio amarillo, pocas verde. Incluye filtros por servicio (agua, electricidad, residuos, transporte), por mes y por estado del reclamo. Click en una zona caliente muestra los reclamos puntuales anonimizados (sin nombre del vecino). Implementado con Leaflet + plugin de Heatmap sobre tiles de OpenStreetMap, lo que evita costos de la API de Google Maps (que cobra por cada 1.000 cargas una vez superado el tier gratis). Visualmente queda idéntico a un Google Maps.",
        quien_aporta: "Configuración técnica del lado del Portal.",
        esfuerzo: "Una hora y media a dos horas.",
      },
      {
        n: "10. Mapa operativo en el panel admin",
        en_que_consiste:
          "Complementario al mapa de calor: una vista donde el gestor del Ente o Julieta vea cada reclamo individual como un pin en el mapa, con clusters por barrio, filtros y link directo al detalle. Es la herramienta para planificar inspecciones territoriales semanales (qué zonas concentran más reclamos esta semana).",
        quien_aporta: "Configuración técnica del lado del Portal.",
        esfuerzo: "Dos horas.",
      },
      {
        n: "11. PWA instalable",
        en_que_consiste:
          "Convertir el sitio en una Progressive Web App permite que el vecino pueda instalar el portal en su pantalla de inicio del celular, como si fuera una app nativa, y que funcione parcialmente sin conexión. Requiere agregar un archivo manifest.webmanifest, un service worker y un set de íconos en distintos tamaños. La ventaja es que aprovecha todo el sitio existente sin desarrollar una app Android o iOS por separado, y se mantiene siempre actualizado automáticamente.",
        quien_aporta: "Configuración técnica.",
        esfuerzo: "Una hora y media.",
      },
      {
        n: "12. Exportación a Excel",
        en_que_consiste:
          "Tanto la bandeja de reclamos como el listado de documentación y el de vencimientos hoy se ven sólo en pantalla. Agregar un botón Exportar a Excel en cada uno permite que las áreas usen los datos para sus informes mensuales (los que se elaboran fuera del sistema, por ejemplo en la generación del informe mensual del Ente).",
        quien_aporta: "Configuración técnica.",
        esfuerzo: "Media hora por listado.",
      },
      {
        n: "13. Integración con WhatsApp Business",
        en_que_consiste:
          "Para complementar el email, integrar WhatsApp Business como canal de notificación. La prestadora puede recibir el aviso de un reclamo nuevo por WhatsApp, el vecino el resultado del trámite, etcétera. Requiere abrir cuenta WhatsApp Business API (proveedor recomendado: Twilio o Meta directo), aprobar plantillas de mensaje y conectar al sistema.",
        quien_aporta: "DNI/CUIT empresa para abrir la cuenta WA Business + aprobación de Meta.",
        esfuerzo: "Dos horas del lado código. Setup administrativo: depende de Meta.",
      },
    ],
  },
  // PRIORIDAD MEDIA - PRODUCCION
  {
    cat: "Prioridad MEDIA — Producción real",
    items: [
      {
        n: "14. Apuntar dominio .gob.ar a Vercel",
        en_que_consiste:
          "Hoy el sitio se sirve en reclamosencosep.vercel.app. Para que tenga apariencia y autoridad institucional plena, conviene apuntar el dominio encosepcomodoro.gob.ar (el actual del Ente) al nuevo portal en Vercel. Esto requiere un cambio de DNS en el panel del Municipio (donde está delegado el .gob.ar), coordinado con el IT municipal. Una vez hecho el cambio, el portal nuevo reemplaza al actual sin que el vecino tenga que cambiar de URL.",
        quien_aporta: "Directorio + IT del Municipio.",
        esfuerzo: "10 minutos del lado portal una vez coordinado el cambio.",
      },
      {
        n: "15. Términos y Condiciones y Política de Privacidad",
        en_que_consiste:
          "El portal recibe datos personales del vecino (DNI, nombre, email, fotos, ubicación GPS). Para cumplir con la Ley de Protección de Datos Personales (Ley 25.326) hay que publicar dos textos legales: Términos y Condiciones de uso del portal, y Política de Privacidad explicando qué datos se recolectan, para qué se usan y cómo se puede solicitar baja o rectificación. Idealmente revisados por el área jurídica del Municipio o un abogado especialista.",
        quien_aporta: "Área jurídica.",
        esfuerzo: "30 minutos de carga de textos.",
      },
      {
        n: "16. Optimización de imágenes pesadas",
        en_que_consiste:
          "Algunas imágenes del sitio están en formatos no óptimos. La foto panorámica de Comodoro pesa 8 MB en PNG y la del logo combinado con la foto otros 3 MB. Convertirlas a formato WebP reduce el peso a unos 500 KB sin pérdida visible y mejora notablemente la velocidad de carga, especialmente en móviles con conexión 3G/4G no óptima. El expediente PDF de la audiencia (36 MB) también podría comprimirse.",
        quien_aporta: "Configuración técnica.",
        esfuerzo: "30 minutos.",
      },
      {
        n: "17. Rate limiting en endpoints públicos",
        en_que_consiste:
          "Los formularios públicos —encuesta de satisfacción, inscripción a audiencias— hoy no tienen protección contra envío masivo automático. Conviene agregar limitación de velocidad por dirección IP (máximo X envíos por minuto) para evitar spam o bots. Vercel ofrece esto de forma nativa con configuración.",
        quien_aporta: "Configuración técnica.",
        esfuerzo: "45 minutos.",
      },
      {
        n: "18. Backup automático de la base",
        en_que_consiste:
          "La base de datos PostgreSQL en Neon ya hace backups automáticos, pero conviene configurar un backup adicional descargable a un Google Drive o servicio externo del Ente, con frecuencia semanal o diaria. Es seguro institucional ante cualquier eventualidad con el proveedor.",
        quien_aporta: "Configuración técnica.",
        esfuerzo: "30 minutos de setup.",
      },
    ],
  },
  // PRIORIDAD BAJA
  {
    cat: "Prioridad BAJA — Mejoras futuras",
    items: [
      {
        n: "19. Integración real con RENAPER",
        en_que_consiste:
          "Hoy el vecino se registra con DNI más clave que él mismo elige. Para validar que el DNI realmente corresponde a esa persona habría que integrar con el padrón RENAPER (Registro Nacional de las Personas) o el padrón del Tribunal Electoral. Esto requiere convenio formal con el organismo nacional o provincial y consumir un API restringido. La ventaja es que evita registraciones falsas y da validez legal plena a cada reclamo.",
        quien_aporta: "Convenio interinstitucional.",
        esfuerzo: "Tres a cinco horas si se concreta el acceso.",
      },
      {
        n: "20. Newsletter para vecinos",
        en_que_consiste:
          "Permitir que cualquier vecino suscriba su email para recibir un boletín mensual o quincenal con cantidad de reclamos resueltos, audiencias próximas y novedades del Ente. Aprovecha la infraestructura de email del punto 8.",
        quien_aporta: "Configuración técnica.",
        esfuerzo: "Una hora.",
      },
      {
        n: "21. Importar Boletín Oficial municipal automáticamente",
        en_que_consiste:
          "Si el Boletín Oficial de Comodoro Rivadavia publica una norma nueva relevante para los servicios públicos, hoy hay que cargarla a mano en el módulo Boletines. Se podría desarrollar un job automático que diariamente lea el Boletín Oficial municipal, detecte normas vinculadas a los servicios bajo control del Ente y las cargue automáticamente con estado borrador para que Marcos las revise y publique. Requiere que el Boletín Oficial municipal tenga un feed o API público (a verificar).",
        quien_aporta: "Configuración técnica + verificar feed del Municipio.",
        esfuerzo: "Dos a cuatro horas.",
      },
      {
        n: "22. App nativa Android e iOS",
        en_que_consiste:
          "Una vez que se valide adopción del portal como PWA, se podría empaquetar como app nativa en Play Store y App Store. La ventaja es presencia oficial en las tiendas y push notifications más confiables. La desventaja es revisión de cada tienda y necesidad de cuenta de desarrollador (Apple cuesta 99 USD anuales). No es prioritario para empezar.",
        quien_aporta: "Decisión institucional + cuentas de desarrollador.",
        esfuerzo: "Doce horas distribuidas entre adaptaciones, builds y publicación.",
      },
      {
        n: "23. Auditoría de acciones administrativas",
        en_que_consiste:
          "Registro completo de todas las acciones de los usuarios del panel admin: quién creó qué, quién modificó qué, quién borró qué, con timestamp e IP. Hoy hay un registro básico (los eventos de reclamos) pero no un audit log institucional completo. Importante para auditorías internas y para responder ante eventuales cuestionamientos sobre intervención sobre expedientes.",
        quien_aporta: "Configuración técnica.",
        esfuerzo: "Tres horas.",
      },
      {
        n: "24. Calendario de inspecciones de Julieta",
        en_que_consiste:
          "Hoy Julieta carga las inspecciones como parte de las Acciones (fotos en /acciones). Un módulo más estructurado tendría planificación de las próximas inspecciones (calendario semanal), registro de cada inspección con barrio, motivo, fotos, observaciones y eventual derivación a expediente. Sirve también para el Informe Mensual: cantidad de inspecciones realizadas, qué se detectó, qué se derivó.",
        quien_aporta: "Configuración técnica + diseño con Julieta.",
        esfuerzo: "Tres a cuatro horas.",
      },
    ],
  },
];

const children = [];

children.push(h1("Pendientes del Portal ENCOSEP"));
children.push(
  p(
    "Documento de relevamiento de tareas pendientes para las próximas sesiones de trabajo sobre el Portal del Ente de Control de los Servicios Públicos de Comodoro Rivadavia.",
  ),
);
children.push(p(""));
children.push(meta("URL pública del Portal", "https://reclamosencosep.vercel.app"));
children.push(meta("Repositorio del código", "https://github.com/directorezequielgarcia/reclamosencosep"));
children.push(meta("Fecha del relevamiento", "26 de mayo de 2026"));
children.push(p(""));

children.push(h2("Estado actual"));
children.push(
  p(
    "El Portal cuenta hoy con sitio institucional completo, sistema de reclamos del vecino con foto y GPS, panel administrativo del Ente con expedientes administrativos, módulo de documentación para prestadoras, calendario de vencimientos, boletines y comunicaciones, audiencias públicas con inscripción ciudadana, indicadores públicos en tiempo real y encuesta general de satisfacción. Todo está desplegado en producción, accesible desde cualquier dispositivo y conectado a base de datos PostgreSQL gestionada por Neon.",
  ),
);
children.push(
  p(
    "Los pendientes a continuación se organizan en cuatro niveles de prioridad. Cada uno incluye el alcance, por qué importa, quién lo aporta y el esfuerzo estimado del lado técnico.",
  ),
);

for (const grupo of pendientes) {
  children.push(h2(grupo.cat));
  for (const it of grupo.items) {
    children.push(h3(it.n));
    children.push(p(it.en_que_consiste));
    children.push(meta("Quién aporta", it.quien_aporta));
    children.push(meta("Esfuerzo técnico estimado", it.esfuerzo));
  }
}

// Recomendación
children.push(h2("Recomendación de orden para próximas sesiones"));
children.push(
  p(
    "Si tuviera que sugerir un orden de trabajo, sería el siguiente:",
  ),
);

children.push(h3("Sesión próxima — Autonomía del equipo"));
children.push(
  p(
    "Atacar los tres puntos que permiten que el equipo del Ente se vuelva autónomo y deje de depender de soporte técnico para tareas operativas: Punto 6 (Cambiar mi contraseña), Punto 5 (Formulario admin de Audiencias), Punto 7 (CMS del sitio institucional). Con esto los cuatro responsables (Adriana, Marcos, Yanina y Julieta) y el Directorio pueden trabajar el sitio y los datos sin intermediario técnico.",
  ),
);

children.push(h3("Sesión siguiente — Comunicación, mapas y territorio"));
children.push(
  p(
    "Una vez resuelta la autonomía, atacar los puntos que hacen el portal más operativo en el día a día: Punto 8 (Notificaciones por email), Punto 9 (Mapa de calor de Comodoro), Punto 10 (Mapa operativo en admin) y Punto 11 (PWA instalable). Esto mejora la experiencia tanto del vecino como del equipo.",
  ),
);

children.push(h3("Sesión de cierre — Producción institucional"));
children.push(
  p(
    "Cuando el portal esté validado por el uso real durante algunas semanas, encarar los puntos de producción definitiva: Punto 14 (dominio .gob.ar), Punto 15 (Términos legales), Punto 16 (Optimización), Punto 17 (Rate limiting), Punto 18 (Backup). Esto convierte el portal de piloto a producción institucional.",
  ),
);

children.push(h3("Datos del usuario en paralelo"));
children.push(
  p(
    "En paralelo a todo lo anterior, los puntos 1 (DNI), 2 (CUITs), 3 (Claves) y 4 (Fotos) no dependen del soporte técnico sino del Directorio y del equipo. Cualquier momento que se tengan esos datos, se actualizan en minutos.",
  ),
);

children.push(h2("Cierre"));
children.push(
  p(
    "El portal en su estado actual ya es funcional, deployable y permite mostrar al Directorio, al Concejo y a la comunidad un trabajo concreto y avanzado. Los pendientes listados son mejoras incrementales sobre una base sólida, no bloqueos críticos. La prioridad sugerida ayuda a que cada nueva sesión sume valor visible y libere al equipo de tareas dependientes del soporte técnico.",
  ),
);
children.push(p(""));
children.push(p("Dr. Cr. Ezequiel García", { bold: true }));
children.push(p("Director — ENCOSEP"));

const doc = new Document({
  creator: "ENCOSEP",
  title: "Pendientes Portal ENCOSEP",
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 },
        paragraph: { spacing: { after: 120, line: 280 } },
      },
    },
  },
  sections: [{ children }],
});

const buf = await Packer.toBuffer(doc);
const out = "C:\\Users\\gje_9\\Claude\\01_ENCOSEP\\Pendientes Portal ENCOSEP.docx";
writeFileSync(out, buf);
console.log(`Generado: ${out}`);
console.log(`Tamaño: ${Math.round(buf.length / 1024)} KB`);
