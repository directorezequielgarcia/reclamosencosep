import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeRevisarDocumentos, esDireccion } from "@/lib/admin";
import { periodoLabel } from "@/lib/documentos";
import { AnalisisForm } from "./AnalisisForm";
import type { ObservacionSeccion } from "@/lib/docx-certificacion";

export const metadata = { title: "Analizar certificación · Panel ENCOSEP" };

export default async function AnalizarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session || !puedeRevisarDocumentos(session.user.rol)) notFound();

  const doc = await prisma.documento.findUnique({
    where: { id },
    include: { prestadora: { include: { servicios: true } } },
  });
  if (!doc) notFound();

  // Solo certificaciones y mensuales tienen análisis
  if (doc.tipo !== "CERTIFICACION" && doc.tipo !== "MENSUAL") notFound();

  const savedObs = doc.observaciones
    ? (doc.observaciones as unknown as ObservacionSeccion[])
    : null;

  return (
    <AnalisisForm
      docId={doc.id}
      docTitulo={doc.titulo}
      docPeriodo={periodoLabel(doc.tipo, doc.periodo)}
      archivoUrl={doc.archivoUrl}
      prestadoraRazonSocial={doc.prestadora.razonSocial}
      servicios={doc.prestadora.servicios}
      savedObs={savedObs}
      savedConclusion={doc.conclusionGeneral ?? null}
      savedMontoMaximo={doc.montoMaximo ?? null}
      savedNotaNumero={doc.notaNumero ?? null}
      savedNotaDocxUrl={doc.notaDocxUrl ?? null}
      esDireccion={esDireccion(session.user.rol)}
    />
  );
}
