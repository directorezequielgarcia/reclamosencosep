"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { puedeGestionarFormulaTransporte } from "@/lib/admin";
import {
  actualizarFormula,
  crearFormula,
  eliminarFormula,
} from "@/lib/formula-transporte-db";
import { datosFormulaVacios, type DatosFormula } from "@/lib/formula-transporte";

async function exigirPermiso() {
  const session = await auth();
  if (!session) throw new Error("Sin sesión");
  if (!puedeGestionarFormulaTransporte(session.user.rol))
    throw new Error("Sin permiso");
  return session;
}

const EstadoEnum = z.enum(["BORRADOR", "CERTIFICADO", "PUBLICADO"]);

// Todos los campos numéricos del formulario. z.coerce.number() acepta el
// string vacío como 0 vía default más abajo.
const DatosSchema = z.object({
  precioCombustibleLitro: z.coerce.number().min(0).default(0),
  precioLubricanteMotor: z.coerce.number().min(0).default(0),
  precioLubricanteDireccion: z.coerce.number().min(0).default(0),
  precioLubricanteCajaDif: z.coerce.number().min(0).default(0),
  precioLavadoEngraseSet: z.coerce.number().min(0).default(0),
  precioCubiertaNueva: z.coerce.number().min(0).default(0),
  precioRecapado: z.coerce.number().min(0).default(0),
  precioVehiculoNuevoUsd: z.coerce.number().min(0).default(0),
  tipoCambio: z.coerce.number().min(0).default(0),
  valorParqueMovilTotal: z.coerce.number().min(0).default(0),
  costoKmSalarios: z.coerce.number().min(0).default(0),
  costoKmSeguros: z.coerce.number().min(0).default(0),
  costoKmMaquinasInmuebles: z.coerce.number().min(0).default(0),
  costoKmPatentes: z.coerce.number().min(0).default(0),
  costoKmVigilancia: z.coerce.number().min(0).default(0),
  costoKmTasasMunicipales: z.coerce.number().min(0).default(0),
  costoKmIngresosBrutos: z.coerce.number().min(0).default(0),
  costoKmCapitalInvertido: z.coerce.number().min(0).default(0),
  recaudacionDigitalTotal: z.coerce.number().min(0).default(0),
  kilometrajeMensualBase: z.coerce.number().min(0).default(0),
  kilometrajeProgramado: z.coerce.number().min(0).default(0),
  kilometrajeAPagarCertificado: z.coerce.number().min(0).default(0),
});

const PrestadoraSchema = z.object({
  prestadoraKilometrajeRecorrido: z.coerce.number().min(0).optional(),
  prestadoraIngresosDeclarados: z.coerce.number().min(0).optional(),
  prestadoraObservaciones: z.string().max(2000).optional(),
});

function parsearFormData(formData: FormData) {
  const raw: Record<string, FormDataEntryValue | null> = {};
  for (const key of Object.keys(DatosSchema.shape)) raw[key] = formData.get(key);
  const datos = DatosSchema.parse(raw);

  const rawPrestadora: Record<string, FormDataEntryValue | undefined> = {};
  for (const key of Object.keys(PrestadoraSchema.shape)) {
    const v = formData.get(key);
    rawPrestadora[key] = v && String(v).trim() !== "" ? v : undefined;
  }
  const prestadora = PrestadoraSchema.parse(rawPrestadora);

  return { ...datos, ...prestadora };
}

const MetaSchema = z.object({
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "Formato AAAA-MM"),
  estado: EstadoEnum,
  fuente: z.string().max(400).optional(),
});

export async function accionCrearFormula(formData: FormData) {
  const session = await exigirPermiso();

  const meta = MetaSchema.parse({
    periodo: formData.get("periodo"),
    estado: formData.get("estado"),
    fuente: formData.get("fuente") || undefined,
  });
  const camposNumericos = parsearFormData(formData);

  const datos: DatosFormula = {
    ...datosFormulaVacios(meta.periodo),
    ...camposNumericos,
    prestadoraKilometrajeRecorrido:
      camposNumericos.prestadoraKilometrajeRecorrido ?? null,
    prestadoraIngresosDeclarados:
      camposNumericos.prestadoraIngresosDeclarados ?? null,
    prestadoraObservaciones: camposNumericos.prestadoraObservaciones ?? null,
  };

  const creada = await crearFormula({
    periodo: meta.periodo,
    estado: meta.estado,
    fuente: meta.fuente ?? null,
    datos,
    creadoPorId: session.user.id ?? null,
    creadoPorNombre: session.user.name ?? null,
  });

  revalidatePath("/admin/formula-transporte");
  redirect(`/admin/formula-transporte/${creada.id}`);
}

export async function accionActualizarFormula(formData: FormData) {
  await exigirPermiso();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");

  const meta = z
    .object({ estado: EstadoEnum, fuente: z.string().max(400).optional() })
    .parse({
      estado: formData.get("estado"),
      fuente: formData.get("fuente") || undefined,
    });
  const camposNumericos = parsearFormData(formData);
  const periodo = String(formData.get("periodo") ?? "");

  const datos: DatosFormula = {
    ...datosFormulaVacios(periodo),
    ...camposNumericos,
    prestadoraKilometrajeRecorrido:
      camposNumericos.prestadoraKilometrajeRecorrido ?? null,
    prestadoraIngresosDeclarados:
      camposNumericos.prestadoraIngresosDeclarados ?? null,
    prestadoraObservaciones: camposNumericos.prestadoraObservaciones ?? null,
  };

  await actualizarFormula(id, {
    estado: meta.estado,
    fuente: meta.fuente ?? null,
    datos,
  });

  revalidatePath("/admin/formula-transporte");
  revalidatePath(`/admin/formula-transporte/${id}`);
  redirect(`/admin/formula-transporte/${id}`);
}

export async function accionEliminarFormula(formData: FormData) {
  await exigirPermiso();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");
  await eliminarFormula(id);
  revalidatePath("/admin/formula-transporte");
  redirect("/admin/formula-transporte");
}
