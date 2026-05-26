import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { writeFileSync } from "node:fs";

const NAVY = "1d3550";

function p(text, opts = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        size: opts.size ?? 22,
        color: opts.color,
      }),
    ],
    spacing: { after: 120 },
  });
}
function h1(t) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: t, bold: true, size: 36, color: NAVY })],
    spacing: { before: 240, after: 180 },
  });
}
function h2(t) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text: t, bold: true, size: 28, color: NAVY })],
    spacing: { before: 240, after: 120 },
  });
}
function h3(t) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text: t, bold: true, size: 24, color: "e88a3c" })],
    spacing: { before: 180, after: 100 },
  });
}
function kv(k, v) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${k}: `, bold: true, size: 20 }),
      new TextRun({ text: v, size: 20 }),
    ],
    spacing: { after: 80 },
  });
}

const c = [];

c.push(h1("Resguardo y Handoff — Portal ENCOSEP"));
c.push(
  p(
    "Documento institucional de resguardo de credenciales, servicios y procedimientos del Portal del Ente de Control de los Servicios Públicos de Comodoro Rivadavia.",
  ),
);
c.push(
  p(
    "Este documento debe guardarse en lugar seguro: una caja fuerte digital institucional (recomendado Bitwarden gratis), una carpeta restringida del Drive del Ente, y/o impreso en archivo físico bajo llave. NO debe subirse al repositorio público de código.",
    { bold: true, color: "c4393c" },
  ),
);
c.push(p(""));
c.push(kv("Fecha del documento", "26 de mayo de 2026"));
c.push(kv("URL pública", "https://reclamosencosep.vercel.app"));
c.push(kv("Repositorio", "https://github.com/directorezequielgarcia/reclamosencosep"));
c.push(kv("Mantenedor actual", "Dr. Cr. Ezequiel García — Director ENCOSEP"));

// SERVICIOS
c.push(h2("1. Servicios contratados (todos en tier gratuito)"));

c.push(h3("GitHub"));
c.push(kv("Usuario", "directorezequielgarcia"));
c.push(kv("Email asociado", "abogadoezequielgarcia@gmail.com"));
c.push(kv("Repo", "https://github.com/directorezequielgarcia/reclamosencosep"));
c.push(kv("Visibilidad", "Público"));
c.push(
  p(
    "Para administrar: ingresar a github.com con el usuario y la clave del Director. Los tokens (PAT) que se hayan generado deben revocarse cuando dejan de usarse.",
  ),
);

c.push(h3("Vercel"));
c.push(kv("Cuenta", "ezegarcia-s-projects"));
c.push(kv("Login", "via GitHub OAuth (mismo usuario que GitHub)"));
c.push(
  kv(
    "Panel del proyecto",
    "https://vercel.com/ezegarcia-s-projects/reclamosencosep",
  ),
);
c.push(kv("Plan", "Hobby (free)"));
c.push(
  p(
    "Vercel hace el deploy automático cada vez que se hace push al branch main en GitHub. Si nunca se llega al 100 GB-hora mensual ni se exceden los límites del free tier, no se cobra nunca. Para aumentar capacidad: Vercel Pro a USD 20/mes (no recomendado hoy, sobra con el free).",
  ),
);

c.push(h3("Neon Postgres"));
c.push(
  kv(
    "Acceso",
    "Integrado en Vercel Storage → no requiere login separado a Neon",
  ),
);
c.push(kv("Plan", "Free"));
c.push(kv("Almacenamiento", "0.5 GB incluidos"));
c.push(kv("Compute", "100 horas-CU por mes"));
c.push(kv("Backup", "Diario automático de Neon (free)"));
c.push(
  p(
    "Para acceder directo a la consola de Neon: ingresar a https://console.neon.tech/ con la cuenta GitHub. La base se llama neondb. Las credenciales completas viven en las variables de entorno de Vercel.",
  ),
);

c.push(h3("Vercel Blob"));
c.push(kv("Nombre del store", "fotos-reclamamos"));
c.push(kv("Visibilidad", "Público"));
c.push(kv("Plan", "Free"));
c.push(kv("Almacenamiento", "1 GB incluido"));
c.push(
  p(
    "Almacena las fotos de los reclamos y eventualmente los PDFs de documentación de prestadoras. La URL de cada archivo es del tipo https://[id].public.blob.vercel-storage.com/...",
  ),
);

// CREDENCIALES SISTEMA
c.push(h2("2. Cuentas de usuarios productivos"));

c.push(h3("Directorio"));
c.push(kv("Dr. Cristian Serdeiro (Presidente)", "no creado todavía"));
c.push(kv("Dr. Cr. Ezequiel García (Director)", "DNI 27345678 / demo1234 (SUPER_ADMIN)"));
c.push(kv("Arq. Maximiliano López (Director)", "no creado todavía"));

c.push(h3("Equipo del Ente (clave temporal: encosep-2026)"));
c.push(kv("Adriana Almonacid (Control Documental)", "DNI temporal 11111111"));
c.push(kv("Marcos Barrionuevo (Comunicación)", "DNI temporal 22222222"));
c.push(kv("Yanina del Bono (Expedientes)", "DNI temporal 33333333"));
c.push(kv("Julieta Palacios (Inspecciones)", "DNI temporal 44444444"));

c.push(h3("Operadores de prestadoras"));
c.push(kv("SCPL", "CUIT 30528775409 / clave scpl-2026"));
c.push(kv("CLEAR URBANA", "CUIT placeholder 30710000001 / clave clear-2026"));
c.push(kv("PATAGONIA Argentina", "CUIT placeholder 30710000002 / clave patagonia-2026"));
c.push(kv("TRANSPORTE DIADEMA", "CUIT placeholder 30710000003 / clave diadema-2026"));

c.push(h3("Demos (para presentaciones)"));
c.push(kv("Vecino demo", "DNI 40555666 / clave demo1234"));
c.push(kv("Gestor del Ente demo", "DNI 30111222 / clave demo1234"));
c.push(kv("Operadora SCPL demo", "DNI 33444555 / clave demo1234"));

// PROCEDIMIENTOS DE RESGUARDO
c.push(h2("3. Procedimientos de resguardo"));

c.push(h3("Backup semanal de la base de datos"));
c.push(
  p(
    "Ejecutar cada lunes (o el día que el equipo defina) en la PC donde está el código:",
  ),
);
c.push(
  p(
    "1) Abrir PowerShell en la carpeta del proyecto: C:\\Users\\gje_9\\Claude\\01_ENCOSEP\\reclamos-app",
  ),
);
c.push(p("2) Ejecutar: node scripts/backup-db.mjs"));
c.push(
  p(
    "3) Tomar el archivo generado (backup-encosep-YYYY-MM-DD.sql) y subirlo a la carpeta 'Resguardo Portal ENCOSEP' del Google Drive institucional.",
  ),
);

c.push(h3("Backup mensual completo del proyecto"));
c.push(p("Cada primer día del mes:"));
c.push(p("1) git clone del repo a una carpeta nueva"));
c.push(p("2) Ejecutar backup-db.mjs y guardar el .sql junto al clone"));
c.push(p("3) Empaquetar todo en ZIP"));
c.push(p("4) Guardar en disco externo del Ente Y en Google Drive institucional"));

c.push(h3("Mirror del repositorio en otro proveedor"));
c.push(
  p(
    "Recomendado: registrar cuenta gratis en Codeberg.org o GitLab.com y configurar un mirror del repo. Esto protege contra cualquier eventualidad con GitHub. Mensualmente, sincronizar: git push mirror main",
  ),
);

c.push(h3("Custodia de credenciales"));
c.push(p("Guardar este documento + las claves reales en:"));
c.push(p("• Bitwarden gratis institucional del Ente (recomendado)"));
c.push(
  p(
    "• Carpeta cifrada del Google Drive institucional con acceso restringido al Directorio",
  ),
);
c.push(
  p(
    "• Copia impresa firmada por el Directorio en sobre cerrado bajo llave en archivo físico",
  ),
);

// MIGRACION SI CAMBIA EL MANTENEDOR
c.push(h2("4. Migración del mantenedor"));

c.push(
  p(
    "Si en algún momento el actual mantenedor (Dr. García) deja de operar el portal, los pasos para transferir el control son:",
  ),
);
c.push(p("1) Crear una organización en GitHub a nombre del ENCOSEP."));
c.push(p("2) Transferir el repositorio a esa organización."));
c.push(
  p(
    "3) En Vercel, transferir el proyecto a un equipo nuevo (también gratis) propiedad del ENCOSEP.",
  ),
);
c.push(
  p(
    "4) Cambiar todas las claves productivas siguiendo el procedimiento descripto en HANDOFF.md.",
  ),
);
c.push(
  p(
    "5) Actualizar este documento de resguardo con los nuevos datos del mantenedor.",
  ),
);

// CONTACTO
c.push(h2("5. Contacto técnico"));
c.push(p("Mantenedor actual:"));
c.push(p("Dr. Cr. Ezequiel García", { bold: true }));
c.push(p("Director — ENCOSEP Comodoro Rivadavia"));
c.push(p("abogadoezequielgarcia@gmail.com"));
c.push(p(""));
c.push(
  p(
    "Asistencia técnica disponible vía Claude (claude.ai) — sin costo. Para invocar la asistencia: abrir Claude Code en la PC del mantenedor y solicitar 'seguí con el portal ENCOSEP'. La memoria del proyecto está guardada y reconoce el contexto completo.",
  ),
);

const doc = new Document({
  creator: "ENCOSEP",
  title: "Resguardo Portal ENCOSEP",
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 },
        paragraph: { spacing: { after: 120, line: 280 } },
      },
    },
  },
  sections: [{ children: c }],
});

const buf = await Packer.toBuffer(doc);
const out = "C:\\Users\\gje_9\\Claude\\01_ENCOSEP\\Resguardo Portal ENCOSEP.docx";
writeFileSync(out, buf);
console.log(`Generado: ${out}`);
console.log(`Tamaño: ${Math.round(buf.length / 1024)} KB`);
