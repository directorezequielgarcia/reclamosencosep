/**
 * GET /api/admin/expediente/[id]/docx?hoja=a4|oficio&nro=&solo=&hasta=
 * Exporta el expediente emitido (mismo alcance, visibilidad y número manual
 * que la vista imprimible) en formato Word.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ROLES_ADMIN } from "@/lib/admin";
import { TIPO_ACTO_META } from "@/lib/expedientes";
import {
  cargarEmisionExpediente,
  ubicacionReclamo,
} from "@/lib/expediente-emision";
import { generarExpedienteDocx } from "@/lib/docx-expediente";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !ROLES_ADMIN.includes(session.user.rol)) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const { id } = await params;
  const q = new URL(req.url).searchParams;
  const hoja = q.get("hoja") === "oficio" ? "oficio" : "a4";

  const datos = await cargarEmisionExpediente(
    id,
    {
      solo: q.get("solo") ?? undefined,
      hasta: q.get("hasta") ?? undefined,
      nro: q.get("nro") ?? undefined,
    },
    session,
  );
  if (!datos) {
    return new NextResponse("Expediente no encontrado", { status: 404 });
  }
  const { exp, actos, nro, anio, reclamante } = datos;

  const fmt = (d: Date) =>
    d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const buffer = await generarExpedienteDocx(
    {
      nro,
      anio,
      tipoExpediente: exp.tipoExpediente,
      caratula: exp.caratula,
      asunto: exp.asunto,
      prestadora: `${exp.prestadora.razonSocial}${exp.prestadora.cuit ? ` (CUIT ${exp.prestadora.cuit})` : ""}`,
      reclamante,
      intervinientes: exp.intervinientes,
      iniciadoEn: exp.createdAt,
      reclamos: exp.reclamos.map((r) => ({
        codigo: r.codigo,
        titulo: r.titulo,
        descripcion: r.descripcion,
        ubicacion: ubicacionReclamo(r),
      })),
      actos: actos.map((a) => ({
        tipoLabel: TIPO_ACTO_META[a.tipo].label,
        titulo: a.titulo,
        cuerpo: a.cuerpo,
        creadoEn: a.createdAt,
        adjuntos: a.adjuntos.map((x) => x.nombre ?? "Archivo"),
        firmas: a.tipo === "RESOLUCION",
        notificado: a.notificadoEn
          ? `Notificado a ${a.notificadoA} el ${fmt(a.notificadoEn)}.`
          : null,
      })),
    },
    hoja,
  );

  const filename = `Expediente_${nro}-${anio}_${hoja.toUpperCase()}.docx`.replace(
    /[^A-Za-z0-9_.-]/g,
    "_",
  );
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
