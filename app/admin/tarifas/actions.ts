"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { puedeGestionarTarifas } from "@/lib/admin";
import { guardarPdfCuadro } from "@/lib/uploads";
import {
  actualizarCuadro,
  crearCuadro,
  eliminarCuadro,
  getCuadro,
  seedCuadroInicial,
} from "@/lib/tarifas-db";
import {
  CUADRO_FEB_2026,
  aplicarAumento,
  datosDeCuadro,
  type CuadroEstado,
} from "@/lib/tarifas";

async function exigirPermiso() {
  const session = await auth();
  if (!session) throw new Error("Sin sesión");
  if (!puedeGestionarTarifas(session.user.rol)) throw new Error("Sin permiso");
  return session;
}

const EstadoEnum = z.enum(["VIGENTE", "ANTERIOR", "PEDIDO", "BORRADOR"]);

function fechaOpcional(v: FormDataEntryValue | null): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

/** Carga el cuadro feb-2026 del código a la base (solo si está vacía). */
export async function accionSeedInicial() {
  await exigirPermiso();
  await seedCuadroInicial();
  revalidatePath("/admin/tarifas");
  revalidatePath("/tarifas");
}

const CrearSchema = z.object({
  nombre: z.string().min(3).max(160),
  expediente: z.string().max(120).optional(),
  estado: EstadoEnum,
  fuente: z.string().max(400).optional(),
  baseId: z.string().optional(), // cuadro del que se copian los valores
  pctAumento: z.coerce.number().min(-100).max(1000).default(0),
  publicado: z.coerce.boolean().default(false),
});

/**
 * Crea un cuadro nuevo copiando los valores de un cuadro base (o del cuadro
 * feb-2026 si no se indica base) y aplicándoles un % de aumento. Sirve para
 * cargar un "aumento pedido" en pocos clics. Opcionalmente sube el PDF.
 */
export async function accionCrearCuadro(formData: FormData) {
  const session = await exigirPermiso();

  const parsed = CrearSchema.safeParse({
    nombre: formData.get("nombre"),
    expediente: formData.get("expediente") || undefined,
    estado: formData.get("estado"),
    fuente: formData.get("fuente") || undefined,
    baseId: formData.get("baseId") || undefined,
    pctAumento: formData.get("pctAumento") || 0,
    publicado: formData.get("publicado") === "on",
  });
  if (!parsed.success) throw new Error("Datos inválidos");
  const d = parsed.data;

  // Valores base
  const base = d.baseId ? await getCuadro(d.baseId) : null;
  const datosBase = base ? datosDeCuadro(base) : datosDeCuadro(CUADRO_FEB_2026);
  const datos = d.pctAumento ? aplicarAumento(datosBase, d.pctAumento) : datosBase;

  const creado = await crearCuadro({
    nombre: d.nombre,
    expediente: d.expediente ?? null,
    estado: d.estado as CuadroEstado,
    vigenteDesde: fechaOpcional(formData.get("vigenteDesde")),
    fuente: d.fuente ?? null,
    datos,
    publicado: d.publicado,
    creadoPorId: session.user.id ?? null,
    creadoPorNombre: session.user.name ?? null,
  });

  // PDF opcional
  const pdf = formData.get("pdf");
  if (pdf instanceof File && pdf.size > 0) {
    const up = await guardarPdfCuadro(creado.id, pdf);
    await actualizarCuadro(creado.id, { pdfUrl: up.url });
  }

  revalidatePath("/admin/tarifas");
  revalidatePath("/tarifas");
  redirect("/admin/tarifas");
}

const EditarSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(3).max(160),
  expediente: z.string().max(120).optional(),
  estado: EstadoEnum,
  fuente: z.string().max(400).optional(),
  publicado: z.coerce.boolean().default(false),
});

/** Actualiza la metadata de un cuadro y, si se adjunta, su PDF. */
export async function accionActualizarCuadro(formData: FormData) {
  await exigirPermiso();

  const parsed = EditarSchema.safeParse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    expediente: formData.get("expediente") || undefined,
    estado: formData.get("estado"),
    fuente: formData.get("fuente") || undefined,
    publicado: formData.get("publicado") === "on",
  });
  if (!parsed.success) throw new Error("Datos inválidos");
  const d = parsed.data;

  await actualizarCuadro(d.id, {
    nombre: d.nombre,
    expediente: d.expediente ?? null,
    estado: d.estado as CuadroEstado,
    vigenteDesde: fechaOpcional(formData.get("vigenteDesde")),
    fuente: d.fuente ?? null,
    publicado: d.publicado,
  });

  const pdf = formData.get("pdf");
  if (pdf instanceof File && pdf.size > 0) {
    const up = await guardarPdfCuadro(d.id, pdf);
    await actualizarCuadro(d.id, { pdfUrl: up.url });
  }

  revalidatePath("/admin/tarifas");
  revalidatePath("/tarifas");
  redirect("/admin/tarifas");
}

export async function accionTogglePublicado(formData: FormData) {
  await exigirPermiso();
  const id = String(formData.get("id") ?? "");
  const publicado = formData.get("publicado") === "true";
  if (!id) throw new Error("Falta id");
  await actualizarCuadro(id, { publicado });
  revalidatePath("/admin/tarifas");
  revalidatePath("/tarifas");
}

export async function accionEliminar(formData: FormData) {
  await exigirPermiso();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");
  await eliminarCuadro(id);
  revalidatePath("/admin/tarifas");
  revalidatePath("/tarifas");
}
