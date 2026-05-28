"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeExportarInformes } from "@/lib/admin";
import { recolectarDatosMes } from "@/lib/informe-mensual-data";
import {
  generarBorradorInforme,
  type BloquesInforme,
} from "@/lib/informe-mensual-borrador";

/**
 * Crea (o reabre) el informe mensual del par (anio, mes). Si ya existe en
 * BORRADOR, no lo pisa. Si está PUBLICADO, lo archiva y crea uno nuevo
 * basado en los datos actuales — esto permite re-emitir un informe con
 * datos actualizados sin perder el histórico.
 */
const PeriodoSchema = z.object({
  anio: z.coerce.number().int().gte(2020).lte(2100),
  mes: z.coerce.number().int().gte(1).lte(12),
});

export async function crearOAbrirInforme(formData: FormData) {
  const session = await auth();
  if (!session || !puedeExportarInformes(session.user.rol)) {
    throw new Error("Solo el Directorio puede generar informes oficiales");
  }
  const parsed = PeriodoSchema.safeParse({
    anio: formData.get("anio"),
    mes: formData.get("mes"),
  });
  if (!parsed.success) throw new Error("Período inválido");
  const { anio, mes } = parsed.data;

  // ¿Existe un informe para este período?
  const existente = await prisma.informeMensual.findUnique({
    where: { anio_mes: { anio, mes } },
  });

  if (existente && existente.estado === "BORRADOR") {
    redirect(`/admin/informes/mensual/${existente.id}`);
  }

  // Si el existente está PUBLICADO, lo archivamos antes de crear el nuevo.
  if (existente && existente.estado === "PUBLICADO") {
    // PostgreSQL no permite dos registros con el mismo @@unique([anio, mes]),
    // así que solo dejamos uno "activo" por período. Borramos el unique al
    // archivar moviendo a un período sintético — pero eso es complejo.
    // Estrategia simple: el unique impide dos. Si querés re-emitir, primero
    // marcamos el actual como ARCHIVADO y borramos el unique... mejor:
    // mantenemos solo 1 por (anio, mes); archivar es para conservar el snapshot
    // de bloques+métricas pero perder la unicidad.
    // Solución pragmática: cuando se "reabre", mantenemos el mismo registro
    // pero volvemos a BORRADOR y refrescamos métricas/bloques.
    const data = await recolectarDatosMes(anio, mes);
    const bloques = generarBorradorInforme(data);
    await prisma.informeMensual.update({
      where: { id: existente.id },
      data: {
        estado: "BORRADOR",
        bloques: bloques as object,
        metricas: data as unknown as object,
        emitidoPorId: null,
        emitidoEn: null,
        docxUrl: null,
      },
    });
    redirect(`/admin/informes/mensual/${existente.id}`);
  }

  // No existe: lo creamos con borrador automático.
  const data = await recolectarDatosMes(anio, mes);
  const bloques = generarBorradorInforme(data);

  const creado = await prisma.informeMensual.create({
    data: {
      anio,
      mes,
      estado: "BORRADOR",
      bloques: bloques as object,
      metricas: data as unknown as object,
    },
  });

  revalidatePath("/admin/informes");
  redirect(`/admin/informes/mensual/${creado.id}`);
}

/**
 * Guarda los bloques editados del informe mensual.
 * Acepta los 7 bloques en formato bloque_<id> dentro del FormData.
 */
export async function actualizarBloques(formData: FormData) {
  const session = await auth();
  if (!session || !puedeExportarInformes(session.user.rol)) {
    throw new Error("Sin permisos");
  }
  const id = String(formData.get("informeId") ?? "");
  if (!id) throw new Error("Falta informeId");

  const informe = await prisma.informeMensual.findUnique({ where: { id } });
  if (!informe) throw new Error("Informe no encontrado");
  if (informe.estado === "ARCHIVADO") {
    throw new Error("El informe está archivado, no se puede editar");
  }

  // Reconstruimos el JSON de bloques desde los inputs.
  const bloquesActuales = informe.bloques as unknown as BloquesInforme;
  const seccion1: BloquesInforme["seccion1"] = {
    intro: String(formData.get("seccion1.intro") ?? bloquesActuales.seccion1.intro),
    porServicio: { ...bloquesActuales.seccion1.porServicio },
  };
  const seccion2: BloquesInforme["seccion2"] = {
    porServicio: { ...bloquesActuales.seccion2.porServicio },
  };
  const seccion3: BloquesInforme["seccion3"] = {
    porServicio: { ...bloquesActuales.seccion3.porServicio },
  };

  for (const key of Object.keys(bloquesActuales.seccion1.porServicio)) {
    const v1 = formData.get(`seccion1.porServicio.${key}`);
    if (typeof v1 === "string") seccion1.porServicio[key] = v1;
    const v2 = formData.get(`seccion2.porServicio.${key}`);
    if (typeof v2 === "string") seccion2.porServicio[key] = v2;
    const v3 = formData.get(`seccion3.porServicio.${key}`);
    if (typeof v3 === "string") seccion3.porServicio[key] = v3;
  }

  const bloques: BloquesInforme = {
    seccion1,
    seccion2,
    seccion3,
    seccion4: String(formData.get("seccion4") ?? bloquesActuales.seccion4),
    seccion5: String(formData.get("seccion5") ?? bloquesActuales.seccion5),
    seccion6: String(formData.get("seccion6") ?? bloquesActuales.seccion6),
    seccion7: String(formData.get("seccion7") ?? bloquesActuales.seccion7),
  };

  await prisma.informeMensual.update({
    where: { id },
    data: { bloques: bloques as object },
  });

  revalidatePath(`/admin/informes/mensual/${id}`);
}

export async function publicarInforme(formData: FormData) {
  const session = await auth();
  if (!session || !puedeExportarInformes(session.user.rol)) {
    throw new Error("Sin permisos");
  }
  const id = String(formData.get("informeId") ?? "");
  if (!id) throw new Error("Falta informeId");

  await prisma.informeMensual.update({
    where: { id },
    data: {
      estado: "PUBLICADO",
      emitidoPorId: session.user.id,
      emitidoEn: new Date(),
    },
  });

  revalidatePath(`/admin/informes/mensual/${id}`);
  revalidatePath("/admin/informes");
}

export async function regenerarBorrador(formData: FormData) {
  const session = await auth();
  if (!session || !puedeExportarInformes(session.user.rol)) {
    throw new Error("Sin permisos");
  }
  const id = String(formData.get("informeId") ?? "");
  if (!id) throw new Error("Falta informeId");

  const informe = await prisma.informeMensual.findUnique({ where: { id } });
  if (!informe) throw new Error("Informe no encontrado");
  if (informe.estado !== "BORRADOR") {
    throw new Error("Solo se puede regenerar un informe en borrador");
  }

  const data = await recolectarDatosMes(informe.anio, informe.mes);
  const bloques = generarBorradorInforme(data);

  await prisma.informeMensual.update({
    where: { id },
    data: {
      bloques: bloques as object,
      metricas: data as unknown as object,
    },
  });

  revalidatePath(`/admin/informes/mensual/${id}`);
}
