/**
 * Contenido "¿Qué podés hacer?" que se muestra en el ingreso, ANTES de poner
 * la clave, según el perfil que eligió el usuario.
 *
 * Para cada perfil se explica: su función y relación con el ENCOSEP, las
 * secciones que tiene habilitadas y sus deberes/obligaciones dentro de la
 * normativa vigente. Todo enmarcado en la triple misión del Ente.
 *
 * IMPORTANTE: esto ORIENTA, no autoriza. Los permisos reales los da el rol del
 * usuario una vez autenticado.
 */

export type PerfilKey =
  | "vecino"
  | "prestadora"
  | "team"
  | "autoridad"
  | "pem"
  | "concejo";

export type PerfilAcceso = {
  key: PerfilKey;
  emoji: string;
  titulo: string;
  /** Una línea de quién es. */
  rolLinea: string;
  /** Función y relación con el ENCOSEP (prosa breve). */
  funcion: string;
  /** Secciones habilitadas en el sistema. */
  secciones: string[];
  /** Etiqueta del segundo bloque: "Tus deberes" o "Tu rol". */
  deberesLabel: string;
  /** Deberes/obligaciones (o responsabilidades) dentro de la normativa. */
  deberes: string[];
};

/**
 * La misión del Ente, transversal a todos los perfiles. Marco: Ordenanza
 * 13.189/17 de creación del ENCOSEP.
 */
export const MISION_ENCOSEP =
  "El ENCOSEP es, ante todo, un productor de información, un controlador de las prestadoras y un canal de atención al usuario y la defensa de sus derechos (Ordenanza 13.189/17).";

export const PERFILES_ACCESO: Record<PerfilKey, PerfilAcceso> = {
  vecino: {
    key: "vecino",
    emoji: "🏠",
    titulo: "Vecino / Usuario",
    rolLinea: "Destinatario del servicio y titular de los derechos que el Ente protege.",
    funcion:
      "Sos el usuario del servicio público. Tu reclamo es la principal fuente de información del Ente para controlar a las prestadoras y exigir que el servicio se preste como corresponde.",
    secciones: [
      "Cargar reclamos y seguir su estado en tiempo real",
      "Ver tus reclamos y el expediente de cada uno",
      "Calificar los servicios en la encuesta de satisfacción",
      "Consultar la normativa de cada servicio",
    ],
    deberesLabel: "Tus deberes",
    deberes: [
      "Iniciar primero el reclamo ante la prestadora y conservar la constancia",
      "Aportar datos veraces: ubicación, fecha, qué pasó y qué empresa presta el servicio",
      "Acudir al Ente si la prestadora no contesta en plazo o la respuesta no satisface",
    ],
  },
  prestadora: {
    key: "prestadora",
    emoji: "🏢",
    titulo: "Prestadora",
    rolLinea: "Empresa concesionaria del servicio (SCPL, Clear Urbana, Sol Bus, Diadema).",
    funcion:
      "Sos la prestadora del servicio. Ante el ENCOSEP respondés por la calidad de la prestación y por la información que el Ente requiere para ejercer su control.",
    secciones: [
      "Bandeja de reclamos asignados",
      "Descargo y respuestas dentro de los expedientes",
      "Normativa, pliegos y reglamentos vigentes",
      "Documentación a presentar y vencimientos",
    ],
    deberesLabel: "Tus obligaciones",
    deberes: [
      "Responder los reclamos dentro del plazo de 15 días",
      "Presentar la documentación e información que el Ente requiera",
      "Cumplir el pliego, el contrato de concesión y los reglamentos del usuario",
      "Comparecer a las audiencias públicas a las que se la convoque",
    ],
  },
  team: {
    key: "team",
    emoji: "🛡️",
    titulo: "Team EnCoSeP",
    rolLinea: "Equipo operativo del Ente de Control.",
    funcion:
      "Sos parte del equipo del Ente. Gestionás reclamos, inspecciones y expedientes, y producís la información objetiva que sostiene el control de las prestadoras.",
    secciones: [
      "Bandeja y gestión de reclamos",
      "Expedientes e inspecciones de campo",
      "Documentación de prestadoras y vencimientos",
      "Audiencias, boletines e informes",
    ],
    deberesLabel: "Tus deberes",
    deberes: [
      "Tramitar las actuaciones en plazo y fundadas en la normativa vigente",
      "Resguardar los datos personales de los usuarios",
      "Producir información trazable y objetiva para el control y los informes",
    ],
  },
  autoridad: {
    key: "autoridad",
    emoji: "⚖️",
    titulo: "Autoridad de Aplicación",
    rolLinea: "Organismo que aplica las sanciones.",
    funcion:
      "Sos la autoridad que aplica las sanciones. El ENCOSEP te provee la fiscalización, los expedientes y las recomendaciones; vos resolvés en el marco de tu competencia.",
    secciones: [
      "Indicadores y reportes del estado de los servicios",
      "Expedientes del Ente",
      "Recomendaciones de aplicación de sanciones",
      "Normativa por servicio · Notas · Capacitación",
    ],
    deberesLabel: "Tu rol",
    deberes: [
      "Resolver en el marco de la normativa vigente y el debido proceso",
      "Dar tratamiento a las recomendaciones y expedientes que eleva el Ente",
      "Garantizar el derecho de defensa de la prestadora",
    ],
  },
  pem: {
    key: "pem",
    emoji: "🏛️",
    titulo: "Poder Ejecutivo Municipal",
    rolLinea: "Gobierno municipal — toma de decisiones de gestión.",
    funcion:
      "Sos el Poder Ejecutivo Municipal. El ENCOSEP te asiste con información técnica sobre el estado de los servicios para acompañar tus decisiones de gobierno.",
    secciones: [
      "Indicadores y estado de los servicios",
      "Reportes y encuestas de satisfacción",
      "Agenda y audiencias públicas",
      "Notas con el Ente · Normativa por servicio",
    ],
    deberesLabel: "Tu rol",
    deberes: [
      "Usar la información del Ente para la toma de decisiones de gestión",
      "Articular las políticas vinculadas a los servicios públicos concesionados",
    ],
  },
  concejo: {
    key: "concejo",
    emoji: "🗳️",
    titulo: "Concejo Deliberante",
    rolLinea: "Órgano legislativo local — presidencia y concejales.",
    funcion:
      "Sos el órgano legislativo local. El ENCOSEP te aporta información y diagnósticos para tu función de control político y para la producción normativa.",
    secciones: [
      "Indicadores y reportes",
      "Problemas por barrio y por servicio",
      "Agenda y audiencias públicas",
      "Notas con el Ente · Normativa por servicio",
    ],
    deberesLabel: "Tu rol",
    deberes: [
      "Ejercer el control político y la función legislativa con base en información objetiva",
      "Requerir al Ente los informes que necesite para legislar sobre los servicios",
    ],
  },
};

/** Devuelve el perfil válido o null si la clave no existe. */
export function perfilDesde(param: string | undefined): PerfilAcceso | null {
  if (!param) return null;
  return PERFILES_ACCESO[param as PerfilKey] ?? null;
}
