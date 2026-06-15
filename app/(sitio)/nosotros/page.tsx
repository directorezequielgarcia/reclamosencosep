import Link from "next/link";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";

export const metadata = { title: "Nosotros · ENCOSEP" };

const DIRECTORIO = [
  {
    cargo: "Presidente",
    nombre: "Dr. Cristian Serdeiro",
    bio: "Abogado. Asumió la presidencia del Directorio el 01-12-2025.",
  },
  {
    cargo: "Vicepresidente",
    nombre: "Dr. Cr. Ezequiel García",
    bio: "Abogado y Contador Público. Integrante del Directorio desde el 01-12-2025.",
  },
  {
    cargo: "Vocal",
    nombre: "Arq. Maximiliano López",
    bio: "Arquitecto. Integrante del Directorio desde el 01-12-2025.",
  },
];

const FUNCIONES_DIRECTORIO = [
  "Dictar el reglamento interno y las normas internas del Ente.",
  "Aprobar el plan operativo anual y la memoria de gestión.",
  "Resolver expedientes administrativos contra las prestadoras.",
  "Aplicar sanciones por incumplimientos de la normativa.",
  "Aprobar los informes técnicos de control de cada servicio.",
  "Representar institucionalmente al Ente ante terceros.",
  "Coordinar con el Concejo Deliberante y el Departamento Ejecutivo.",
];

// Ciclo Operativo de la Gestión Pública — 4 etapas concatenadas
// que recorren el circuito completo del control institucional.
const CICLO = [
  {
    n: "01",
    titulo: "Servicios: Atención y Acercamiento",
    titular: "Julieta Palacios",
    area: "Área de Atención a Usuarios e Inspecciones",
    icono: "👂",
    cuerpo:
      "El ciclo operativo se inicia en el territorio. Entendemos que atender al usuario cuando lo necesita es un servicio esencial, pero acercarse a cada barrio es otro servicio complementario e igual de crucial. A través de la atención primaria y las inspecciones oculares periódicas, constatamos en el lugar las fallas reales en las prestaciones cotidianas (agua, cloacas, energía o higiene urbana), humanizando el control estatal y brindando respuestas rápidas a pie de calle.",
  },
  {
    n: "02",
    titulo: "Formalidad y Fuerza Legal",
    titular: "Yanina del Bono",
    area: "Área de Gestión de Expedientes y Trámites",
    icono: "⚖️",
    cuerpo:
      "Una vez detectada y constatada la problemática en los barrios, le damos el respaldo institucional que corresponde. Gestionar los expedientes y realizar un seguimiento estricto de los casos pendientes es lo que le otorga formalidad al reclamo y la fuerza legal necesaria. Mediante esta etapa garantizamos la trazabilidad absoluta de cada actuación, impidiendo que las quejas queden archivadas o sin respuesta, y obligando administrativamente a las empresas prestatarias a resolver los inconvenientes bajo el amparo de la normativa vigente.",
  },
  {
    n: "03",
    titulo: "Cuidado del Control Documental y Costos",
    titular: "Adriana Almonacid",
    area: "Área de Control Documental y Certificaciones",
    icono: "🛡️",
    cuerpo:
      "Con el reclamo formalizado y las pruebas del territorio, el ciclo pasa a una rigurosa auditoría de fondo. El control de los costos contractuales y de la documentación técnica es el mecanismo clave para cuidar los impuestos del contribuyente y darle un sentido real al monitoreo de la gestión pública. Al auditar minuciosamente que cada gasto declarado por las empresas esté estrictamente acorde a las obras y contratos de concesión, logramos dictámenes técnicos mucho más sólidos. Esto se traduce de forma directa en un menor costo de erogación para la Municipalidad, protegiendo el bolsillo de toda la comunidad frente a tarifas o inversiones injustificadas.",
  },
  {
    n: "04",
    titulo: "Gestión de Comunicación y Visibilidad",
    titular: "Marcos Barrionuevo",
    area: "Área de Comunicación y Medios",
    icono: "📣",
    cuerpo:
      "El circuito no termina puertas adentro del organismo, sino devolviéndole el protagonismo a la ciudadanía. Gestionar la comunicación de manera abierta y transparente permite que conozcas tus derechos, transmitir información clara y hacer visible tu reclamo. A través de campañas institucionales bajo la premisa de «Alza tu voz», difundimos las herramientas de participación, transparentamos las correcciones exigidas a las prestadoras y rendimos cuentas públicas de todo lo actuado.",
  },
];

const PRINCIPIOS = [
  "CONTINUIDAD",
  "REGULARIDAD",
  "GENERALIDAD",
  "HABITUALIDAD",
  "UNIFORMIDAD",
  "IGUALDAD",
  "ACCESIBILIDAD",
  "MANTENIMIENTO",
];

export default function Nosotros() {
  return (
    <>
      <SeccionHeader
        kicker="Quiénes somos"
        titulo="El Ente de Control de Servicios Públicos"
        descripcion="Organismo municipal con autonomía funcional, creado por Ordenanza 13.189/17 para fiscalizar la prestación de los servicios públicos en Comodoro Rivadavia."
      />
      <main className="max-w-5xl mx-auto px-6 py-10">
      <MigajasSitio items={[{ label: "Nosotros" }]} />
      {/* INTRO */}
      <section className="grid md:grid-cols-2 gap-10">
        <div className="space-y-4 text-navy leading-relaxed">
          <p>
            El <strong>EnCoSeP</strong> es el organismo de la Municipalidad de
            Comodoro Rivadavia creado por la{" "}
            <strong>Ordenanza 13.189/17</strong> con el objeto de controlar la
            prestación de los servicios públicos en jurisdicción municipal.
          </p>
          <p>
            Es una persona jurídica de derecho público con{" "}
            <strong>autonomía funcional e independencia</strong> respecto del
            Poder Ejecutivo Municipal, del Concejo Deliberante y de las
            prestadoras controladas.
          </p>
          <p>
            Nuestra competencia alcanza tanto a los servicios prestados por
            terceros concesionarios como a los prestados directamente por la
            Municipalidad, garantizando a los usuarios los principios
            establecidos en la normativa orgánica.
          </p>
        </div>

        <aside className="rounded-2xl border border-line bg-paper-2 p-5">
          <div className="text-xs font-bold tracking-widest uppercase text-muted">
            Marco normativo
          </div>
          <ul className="mt-3 space-y-2 text-sm text-navy">
            <li>
              <strong>Ord. 13189/17</strong> · Creación del ENCOSEP
            </li>
            <li>
              <strong>Ord. 14995/19</strong> · Reglamento del Usuario de
              electricidad
            </li>
            <li>
              <strong>Ord. 14996/19</strong> · Reglamento del Usuario de agua
              y cloacas
            </li>
            <li>
              <strong>Ord. 11638/14</strong> · Régimen de Residuos Sólidos
              Urbanos
            </li>
          </ul>
          <Link
            href="/control-prestadoras"
            className="inline-block mt-4 text-xs text-navy-2 underline underline-offset-4 font-semibold"
          >
            Ver normativa completa →
          </Link>
        </aside>
      </section>

      {/* ORGANIGRAMA */}
      <section className="mt-14">
        <div className="text-xs font-bold tracking-widest uppercase text-muted">
          Estructura institucional
        </div>
        <h2 className="text-2xl font-extrabold text-navy mt-1">Organigrama</h2>
        <p className="text-sm text-muted mt-2 max-w-3xl">
          Estructura organizativa del Ente, con el Directorio como cuerpo
          colegiado de 3 miembros y cuatro áreas operativas a cargo de los
          responsables actuales.
        </p>

        <div className="mt-6 rounded-2xl border border-line bg-paper p-4 md:p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagenes/organigrama.png"
            alt="Organigrama del ENCOSEP: Directorio (cuerpo colegiado, 3 miembros) y 4 áreas operativas — Comunicación y Medios (Marcos Barrionuevo), Atención a Usuarios e Inspecciones (Julieta Palacios), Gestión de Expedientes y Trámites (Yanina del Bono), Control Documental y Certificaciones (Adriana Almonacid)."
            className="block w-full h-auto"
            loading="lazy"
          />
        </div>
      </section>

      {/* DIRECTORIO */}
      <section className="mt-14">
        <div className="text-xs font-bold tracking-widest uppercase text-muted">
          Conducción
        </div>
        <h2 className="text-2xl font-extrabold text-navy mt-1">
          Directorio actual
        </h2>
        <p className="text-sm text-muted mt-1">
          Mandato: 01/12/2025 a 30/11/2028
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-5">
          {DIRECTORIO.map((d) => (
            <div
              key={d.nombre}
              className="rounded-2xl border border-line bg-paper p-5"
            >
              <div className="w-14 h-14 rounded-full bg-navy-2/10 border-2 border-navy-2 flex items-center justify-center text-navy-2 font-extrabold text-xl mb-3">
                {d.nombre
                  .split(" ")
                  .slice(-2)
                  .map((p) => p.charAt(0))
                  .join("")}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted">
                {d.cargo}
              </div>
              <div className="text-base font-bold text-navy mt-1">
                {d.nombre}
              </div>
              <p className="text-xs text-muted mt-2 leading-relaxed">{d.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONES DEL DIRECTORIO */}
      <section className="mt-14">
        <div className="text-xs font-bold tracking-widest uppercase text-muted">
          Marco orgánico
        </div>
        <h2 className="text-2xl font-extrabold text-navy mt-1">
          Funciones y deberes del Directorio
        </h2>
        <p className="text-sm text-muted mt-2 max-w-3xl">
          Conforme la Ordenanza 13.189/17 de creación del Ente, el Directorio
          tiene a su cargo el gobierno y administración del organismo. Sus
          principales funciones:
        </p>

        <ol className="mt-5 grid sm:grid-cols-2 gap-3 list-decimal list-inside">
          {FUNCIONES_DIRECTORIO.map((f, i) => (
            <li
              key={i}
              className="rounded-xl border border-line bg-paper p-3 text-sm text-navy leading-snug"
            >
              {f}
            </li>
          ))}
        </ol>
      </section>

      {/* CICLO OPERATIVO DE LA GESTIÓN PÚBLICA */}
      <section className="mt-14">
        <div className="text-xs font-bold tracking-widest uppercase text-muted">
          Cómo trabajamos
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-navy mt-1">
          Ciclo Operativo de la Gestión Pública:
          <br className="hidden sm:block" /> El Control es Gestión
        </h2>
        <p className="text-sm text-navy mt-3 max-w-3xl leading-relaxed">
          En el ENCOSEP no trabajamos con tareas aisladas ni burocráticas; nos
          movemos a través de un <strong>circuito continuo</strong> diseñado
          para transformar la fiscalización técnica en valor y soluciones
          concretas para cada habitante de Comodoro Rivadavia. Cada área
          interviene estratégicamente en una etapa clave del proceso para
          cuidar tus recursos y hacer valer tus derechos.
        </p>

        <ol className="mt-8 flex flex-col gap-4 relative">
          {/* Línea vertical conectora */}
          <div
            aria-hidden
            className="hidden md:block absolute left-[44px] top-12 bottom-12 w-0.5 bg-gradient-to-b from-svc-orange via-svc-blue to-svc-green opacity-40"
          />

          {CICLO.map((c) => (
            <li
              key={c.n}
              className="grid md:grid-cols-[88px_1fr] gap-4 items-start"
            >
              <div className="flex md:flex-col items-center gap-2 relative z-10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-svc-orange to-svc-red flex items-center justify-center text-white font-extrabold text-2xl shadow-lg">
                  {c.n}
                </div>
                <div className="text-3xl md:mt-1">{c.icono}</div>
              </div>
              <div className="rounded-2xl border border-line bg-paper p-5">
                <h3 className="text-lg font-extrabold text-navy leading-tight">
                  {c.titulo}
                </h3>
                <div className="text-xs text-muted mt-1">
                  <strong className="text-navy-2">{c.titular}</strong> · {c.area}
                </div>
                <p className="text-sm text-navy mt-3 leading-relaxed">
                  {c.cuerpo}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* DIRECCIÓN ESTRATÉGICA Y SOPORTE TÉCNICO */}
      <section className="mt-14">
        <div className="text-xs font-bold tracking-widest uppercase text-muted">
          Conducción y soporte
        </div>
        <h2 className="text-2xl font-extrabold text-navy mt-1">
          Dirección Estratégica y Soporte Técnico
        </h2>
        <p className="text-sm text-muted mt-2 max-w-3xl">
          Para asegurar que este ciclo de valor público gire de manera
          ininterrumpida y eficiente, la estructura cuenta con dos pilares de
          conducción y asistencia:
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-5">
          <div className="rounded-2xl border-2 border-navy/30 bg-gradient-to-br from-navy/5 to-paper p-5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-navy">
              El Directorio
            </div>
            <h3 className="text-lg font-extrabold text-navy mt-1">
              Cristian, Ezequiel y Maximiliano
            </h3>
            <p className="text-sm text-navy mt-2 leading-relaxed">
              Conducen al equipo para llevar adelante la gestión del control.
              Se encargan de velar por el norte institucional del organismo,
              coordinar las políticas del mandato, elaborar los informes
              mensuales técnicos, mantener reuniones clave con las secretarías
              de aplicación u otros poderes, y proponer formalmente las
              sanciones correspondientes ante los incumplimientos detectados.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-svc-orange/30 bg-gradient-to-br from-svc-orange/5 to-paper p-5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-svc-orange">
              Asesores externos y soporte IT
            </div>
            <h3 className="text-lg font-extrabold text-navy mt-1">
              Equipo técnico especializado
            </h3>
            <p className="text-sm text-navy mt-2 leading-relaxed">
              El ciclo operativo se nutre continuamente de la colaboración de
              ambientalistas, técnicos eléctricos y otros oficios
              especializados para dotar de rigurosidad la confección de
              dictámenes e informes complejos, sumado a un soporte informático
              estratégico enfocado en mejorar la performance, los sistemas de
              reclamos y la eficiencia de la gestión pública.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-line-strong bg-paper-2 p-4 text-xs text-muted leading-relaxed">
          <strong className="text-navy">Aspectos cubiertos:</strong> Claridad,
          transparencia, trazabilidad, rigor técnico, cumplimiento normativo,
          atención ciudadana y fiscalización efectiva.
        </div>
      </section>

      {/* PRINCIPIOS */}
      <section className="mt-14 rounded-2xl border border-line bg-paper-2 p-6">
        <h2 className="text-lg font-extrabold text-navy">
          Principios del control
        </h2>
        <p className="text-sm text-muted mt-1 max-w-3xl">
          Conforme la normativa orgánica, todos los servicios bajo control del
          Ente deben respetar estos principios. Su incumplimiento habilita la
          apertura de un expediente administrativo contra la prestadora.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          {PRINCIPIOS.map((p) => (
            <div
              key={p}
              className="bg-paper rounded-lg border border-line py-3 text-center text-xs font-extrabold text-navy"
            >
              {p}
            </div>
          ))}
        </div>
      </section>

      {/* PLAN DE GESTIÓN */}
      <section className="mt-14">
        <div className="text-xs font-bold tracking-widest uppercase text-muted">
          Planificación institucional
        </div>
        <h2 className="text-2xl font-extrabold text-navy mt-1">
          Plan Estratégico de Gestión · Primer año de mandato
        </h2>

        <div className="mt-5 rounded-2xl border-2 border-svc-orange/40 bg-svc-orange/5 p-5">
          <div className="text-[11px] font-bold tracking-widest uppercase text-svc-orange">
            Visión institucional
          </div>
          <p className="text-base text-navy mt-2 leading-relaxed">
            Transformar al ENCOSEP en un organismo{" "}
            <strong>técnico, cercano al vecino y eficiente</strong> en su rol
            de fiscalizador de los servicios públicos de Comodoro Rivadavia,
            brindando datos para la toma de decisiones por parte de los otros
            poderes.
          </p>
        </div>

        {/* EJE 1 */}
        <div className="mt-8">
          <EjeHeader
            num="01"
            titulo="Fortalecimiento de la Identidad y Presencia Institucional"
            objetivo="Sacar al Ente de las oficinas y posicionarlo en la agenda pública."
          />
          <ul className="mt-4 space-y-3">
            <AccionPlan titulo="Campaña de Reconocimiento">
              Diseñar e implementar un programa de comunicación multiplataforma
              para elevar el nivel de conocimiento de usuarios e instituciones
              sobre las funciones y facultades del ENCOSEP.
            </AccionPlan>
            <AccionPlan titulo="Fiscalización Territorial Directa">
              Ejecutar un cronograma de inspecciones semanales presenciales en
              puntos críticos de la prestación, con participación directa de
              vecinos, instituciones vecinales y empresas, garantizando la
              escucha activa en el lugar de los hechos.
            </AccionPlan>
            <AccionPlan titulo="Agenda Basada en la Escucha Activa">
              Ponderar una agenda propia con objetivos realistas que den
              respuesta a los reclamos mediáticos, de redes sociales y de
              opinión pública, transformando el malestar social en indicadores
              técnicos de control.
            </AccionPlan>
          </ul>
        </div>

        {/* EJE 2 */}
        <div className="mt-10">
          <EjeHeader
            num="02"
            titulo="Modernización y Eficiencia Administrativa"
            objetivo="Agilizar los procesos internos para dar respuestas en tiempo real."
          />
          <ul className="mt-4 space-y-3">
            <AccionPlan titulo="Transformación Digital">
              Gestionar e implementar la apertura y resolución de expedientes
              en formato digital. El objetivo es reducir los tiempos de
              respuesta y permitir la trazabilidad de cada reclamo desde su
              inicio hasta su resolución final.
            </AccionPlan>
            <AccionPlan titulo="Regularización de la Producción Técnica">
              Normalizar y sistematizar la entrega de los Informes Mensuales y
              Anuales exigidos por la Ordenanza 13.189/17, asegurando que la
              información sea enviada al Poder Ejecutivo y Legislativo de
              forma ininterrumpida.
            </AccionPlan>
            <AccionPlan titulo="Repositorio Documental Estratégico">
              Centralizar, actualizar y ordenar la documentación crítica de
              los servicios: contratos de concesión, anexos técnicos,
              certificaciones de obra y expedientes de aumentos tarifarios
              para consulta inmediata.
            </AccionPlan>
          </ul>
        </div>

        {/* EJE 3 */}
        <div className="mt-10">
          <EjeHeader
            num="03"
            titulo="Gobernanza y Articulación Inter-jurisdiccional"
            objetivo="Establecer al ENCOSEP como el nodo central del diálogo entre los actores del servicio público."
          />
          <ul className="mt-4 space-y-3">
            <AccionPlan titulo="Mesas de Diálogo Sectorial">
              Establecer una agenda fija de reuniones de trabajo con las
              empresas prestadoras (SCPL, Patagonia Argentina, Diadema, etc.)
              y las Autoridades de Aplicación (Secretarías Municipales) para
              prevenir conflictos y anticipar crisis.
            </AccionPlan>
            <AccionPlan titulo="Mesas de Enlace Institucional">
              Crear espacios de coordinación con otros organismos relacionados
              (Defensoría del Pueblo, Ente Nacional de Comunicaciones,
              Ministerios Provinciales, etc.) para abordar de forma integral
              las problemáticas de servicios públicos que exceden la
              jurisdicción municipal.
            </AccionPlan>
          </ul>
        </div>

        {/* METAS E INDICADORES */}
        <div className="mt-12">
          <h3 className="text-xl font-extrabold text-navy">
            Metas e indicadores de éxito · Año 1
          </h3>
          <div className="overflow-x-auto mt-4 rounded-2xl border border-line bg-paper">
            <table className="w-full text-sm">
              <thead className="bg-paper-2 text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="text-left font-bold py-3 px-4">Dimensión</th>
                  <th className="text-left font-bold py-3 px-4">Meta</th>
                </tr>
              </thead>
              <tbody>
                <FilaMeta
                  dim="Fiscalización"
                  meta="48 fiscalizaciones territoriales en el año (≈ 1 por semana)"
                />
                <FilaMeta
                  dim="Informes técnicos"
                  meta="Cumplimiento del 100% de los envíos mensuales al Poder Ejecutivo y al Concejo Deliberante · publicación pública"
                />
                <FilaMeta
                  dim="Digitalización"
                  meta="100% de los expedientes 2025 digitalizados y con trazabilidad"
                />
                <FilaMeta
                  dim="Relaciones institucionales"
                  meta="1 Mesa de Enlace bimensual con prestadoras + 2 reuniones con medios contando la agenda del Ente desde mayo"
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SERVICIOS CONTROLADOS */}
      <section className="mt-14 rounded-2xl border border-line bg-paper p-6">
        <h2 className="text-lg font-extrabold text-navy">
          Servicios bajo control
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm text-navy">
          <div>
            <strong>Higiene Urbana</strong> · CLEAR URBANA S.A.
          </div>
          <div>
            <strong>Energía eléctrica y alumbrado</strong> · SCPL
          </div>
          <div>
            <strong>Agua y cloacas</strong> · SCPL
          </div>
          <div>
            <strong>Transporte Urbano</strong> · PATAGONIA Argentina S.R.L. y
            TRANSPORTE DIADEMA S.A.
          </div>
        </div>
        <p className="text-xs text-muted mt-4 leading-relaxed">
          Transporte e Higiene Urbana se encuentran en proceso de licitación
          —contratos prorrogados por el Poder Ejecutivo Municipal—.
        </p>
      </section>
      <VolverInicio />
      </main>
    </>
  );
}

function EjeHeader({
  num,
  titulo,
  objetivo,
}: {
  num: string;
  titulo: string;
  objetivo: string;
}) {
  return (
    <div className="flex items-start gap-4 border-l-4 border-svc-orange pl-4">
      <div className="text-3xl font-mono font-extrabold text-svc-orange leading-none">
        {num}
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Eje {num}
        </div>
        <h3 className="text-lg font-extrabold text-navy leading-tight mt-0.5">
          {titulo}
        </h3>
        <p className="text-sm text-muted mt-1 italic">{objetivo}</p>
      </div>
    </div>
  );
}

function AccionPlan({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-xl border border-line bg-paper p-4">
      <h4 className="text-sm font-bold text-navy">{titulo}</h4>
      <p className="text-sm text-navy mt-1.5 leading-relaxed">{children}</p>
    </li>
  );
}

function FilaMeta({ dim, meta }: { dim: string; meta: string }) {
  return (
    <tr className="border-t border-line">
      <td className="py-3 px-4 font-semibold text-navy align-top whitespace-nowrap">
        {dim}
      </td>
      <td className="py-3 px-4 text-navy leading-relaxed">{meta}</td>
    </tr>
  );
}

function CajaOrg({
  color,
  titulo,
  subtitulo,
  ancho,
}: {
  color: "navy" | "paper";
  titulo: string;
  subtitulo?: string;
  ancho?: string;
}) {
  const cls =
    color === "navy"
      ? "bg-navy text-white border-navy"
      : "bg-paper text-navy border-line-strong";
  return (
    <div
      className={`rounded-xl border-2 px-4 py-3 text-center ${cls} ${ancho ?? ""}`}
    >
      <div className="text-sm font-extrabold uppercase tracking-wider">
        {titulo}
      </div>
      {subtitulo && (
        <div
          className={`text-[11px] mt-1 ${color === "navy" ? "opacity-80" : "text-muted"}`}
        >
          {subtitulo}
        </div>
      )}
    </div>
  );
}
